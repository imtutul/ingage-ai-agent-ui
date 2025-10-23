import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Message, ChatState, QueryResponse, User } from '../models/chat.models';
import { environment } from '../../environments/environment';

/**
 * ChatService - API v2.0.0 Compatible
 * 
 * Handles chat messages and integrates with authenticated API
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_BASE_URL = environment.apiBaseUrl;
  
  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true,
    authenticated: false
  });

  public chatState$ = this.chatStateSubject.asObservable();

  // Query history
  private queryHistorySubject = new BehaviorSubject<QueryResponse[]>([]);
  public queryHistory$ = this.queryHistorySubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeChat();
    this.loadHistoryFromStorage();
  }

  private initializeChat(): void {
    const welcomeMessage: Message = {
      id: this.generateId(),
      content: 'Hello! I\'m your Ingage AI Agent. I\'m here to help answer your questions about your data.',
      timestamp: new Date(),
      sender: 'agent'
    };

    this.addMessage(welcomeMessage);
  }

  /**
   * Update authentication state
   */
  setAuthenticationState(authenticated: boolean, user?: User): void {
    const currentState = this.chatStateSubject.value;
    const updatedState: ChatState = {
      ...currentState,
      authenticated,
      user
    };
    this.chatStateSubject.next(updatedState);
  }

  /**
   * Send message and get query response
   */
  sendMessage(content: string): void {
    const userMessage: Message = {
      id: this.generateId(),
      content,
      timestamp: new Date(),
      sender: 'user'
    };

    this.addMessage(userMessage);
    this.setLoading(true);

    // Make API call to backend
    this.sendToBackend(content);
  }

  private addMessage(message: Message): void {
    const currentState = this.chatStateSubject.value;
    const updatedState: ChatState = {
      ...currentState,
      messages: [...currentState.messages, message]
    };
    this.chatStateSubject.next(updatedState);
  }

  private setLoading(isLoading: boolean): void {
    const currentState = this.chatStateSubject.value;
    const updatedState: ChatState = {
      ...currentState,
      isLoading
    };
    this.chatStateSubject.next(updatedState);
  }

  clearChat(): void {
    const currentState = this.chatStateSubject.value;
    const updatedState: ChatState = {
      ...currentState,
      messages: []
    };
    this.chatStateSubject.next(updatedState);
    this.initializeChat();
  }

  setConnectionStatus(isConnected: boolean): void {
    const currentState = this.chatStateSubject.value;
    const updatedState: ChatState = {
      ...currentState,
      isConnected
    };
    this.chatStateSubject.next(updatedState);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Clean duplicate responses that may contain previous conversation content
   * Extracts only the last/newest response from concatenated AI responses
   */
  private cleanDuplicateResponse(response: string): string {
    if (!response || response.trim() === '') {
      return response;
    }

    // Strategy 1: Look for the last unique response section
    // Split by patterns that typically start new responses
    const responsePatterns = [
      /(?:\n\n|\r\n\r\n)(?=Here are the details for the [a-zA-Z]+ member)/,
      /(?:\n\n|\r\n\r\n)(?=Here are the top \d+ members)/,
      /(?:\n\n|\r\n\r\n)(?=Here are|These are|The following|This member|Member ID:|Based on)/,
      /(?:\n\n|\r\n\r\n)(?=Demographic Information:|Open HEDIS Care Gaps:)/
    ];

    for (const pattern of responsePatterns) {
      const sections = response.split(pattern);
      if (sections.length > 1) {
        // Get the last section which should be the most recent response
        const lastSection = sections[sections.length - 1].trim();
        if (lastSection.length > 50) { // Ensure it's substantial content
          console.log(`🧹 Pattern-based cleaning: ${response.length} -> ${lastSection.length} chars`);
          return lastSection;
        }
      }
    }

    // Strategy 2: Remove duplicate consecutive blocks
    // Split into paragraphs and remove exact duplicates
    const paragraphs = response.split(/\n\n+/);
    const cleanedParagraphs: string[] = [];
    const seenParagraphs = new Set<string>();

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;

      const normalized = paragraph.toLowerCase().replace(/\s+/g, ' ');
      
      // Skip if we've seen this exact paragraph before
      if (seenParagraphs.has(normalized)) {
        console.log(`🧹 Removing duplicate paragraph: "${paragraph.substring(0, 50)}..."`);
        continue;
      }

      seenParagraphs.add(normalized);
      cleanedParagraphs.push(paragraph);
    }

    const dedupedResponse = cleanedParagraphs.join('\n\n');

    // Strategy 3: If we removed significant duplicates, use the cleaned version
    if (dedupedResponse.length < response.length * 0.85) {
      console.log(`🧹 Deduplication: ${response.length} -> ${dedupedResponse.length} chars`);
      return dedupedResponse;
    }

    // Strategy 4: Look for the last complete response based on common endings
    const responseEndings = [
      /Would you like more (detailed )?information.*?\?$/,
      /Would you like.*?\?$/,
      /\?\s*$/,
      /\.\s*$/
    ];

    // Find all positions where complete responses might end
    for (const ending of responseEndings) {
      const matches = Array.from(response.matchAll(new RegExp(ending.source, 'g')));
      if (matches.length > 1) {
        // Take content from the second-to-last match to handle duplicate responses
        const lastMatch = matches[matches.length - 1];
        if (lastMatch.index !== undefined) {
          const beforeLastResponse = response.substring(0, lastMatch.index);
          const lastCompleteResponseStart = Math.max(
            beforeLastResponse.lastIndexOf('\n\nHere are'),
            beforeLastResponse.lastIndexOf('\n\nThe '),
            beforeLastResponse.lastIndexOf('\n\nThis '),
            beforeLastResponse.lastIndexOf('\n\nMember '),
            0
          );
          
          if (lastCompleteResponseStart > 0) {
            const lastResponse = response.substring(lastCompleteResponseStart + 2).trim();
            console.log(`🧹 Last response extraction: ${response.length} -> ${lastResponse.length} chars`);
            return lastResponse;
          }
        }
      }
    }

    // If no cleaning was possible, return original
    console.log(`🧹 No cleaning needed for response (${response.length} chars)`);
    return response;
  }

  /**
   * Format conversation history for API request
   * Converts Message[] to a simplified format for the backend
   * Includes last N messages to provide context while keeping payload manageable
   */
  private formatConversationHistory(messages: Message[]): Array<{role: string, content: string}> {
    // Exclude the last message (current user message), typing indicators, and welcome message
    const previousMessages = messages
      .filter(msg => {
        // Filter out typing indicators
        if (msg.isTyping) return false;
        
        // Filter out the welcome/greeting message (first message or messages without queryResponse)
        // The welcome message is typically the first agent message without a queryResponse
        if (msg.sender === 'agent' && !msg.queryResponse) return false;
        
        return true;
      })
      .slice(0, -1); // Exclude the current message (just added)
    
    // Limit to last 10 messages (5 exchanges) to keep context manageable
    const contextWindow = 10;
    const recentMessages = previousMessages.slice(-contextWindow);
    
    // Convert to simplified format expected by backend
    // For agent messages, clean up any duplicate greeting text
    return recentMessages.map(msg => {
      let content = msg.content;
      
      // For agent messages, clean up any duplicate greeting text
      if (msg.sender === 'agent') {
        // Remove the greeting prefix if it appears (sometimes duplicated)
        const greetingPattern = /^(Hello! I'm your Ingage AI Agent\. I'm here to help answer your questions about your data\.\s*)+/gi;
        content = content.replace(greetingPattern, '').trim();
      }
      
      return {
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: content
      };
    });
  }

  /**
   * Send query to authenticated API
   * API: POST /query
   * Requires: Authentication (cookie-based)
   */
  private sendToBackend(message: string): void {
    // Get conversation history (excluding the current message we just added)
    const currentMessages = this.chatStateSubject.value.messages;
    const conversationHistory = this.formatConversationHistory(currentMessages);
    
    const requestPayload = {
      query: message,
      conversation_history: conversationHistory
    };

    this.http.post<QueryResponse>(`${this.API_BASE_URL}/query`, requestPayload, {
      withCredentials: true // Include session cookie
    })
      .pipe(
        tap(response => {
          // Add to query history
          this.addToHistory({
            ...response,
            query: message,
            timestamp: new Date()
          });
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API call failed:', error);
          console.log('API call failed:', error);
          
          // Handle 401 Unauthorized
          if (error.status === 401) {
            this.setAuthenticationState(false);
            return of({
              success: false,
              response: "Your session has expired. Please sign in again to continue.",
              error: "Authentication required"
            } as QueryResponse);
          }
          
          this.setConnectionStatus(false);
          
          // Return a user-friendly error message
          return of({
            success: false,
            response: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
            error: error.message || "Connection error"
          } as QueryResponse);
        })
      )
      .subscribe({
        next: (response: QueryResponse) => {
          this.setConnectionStatus(true);
          this.setLoading(false);
          console.log(response)
          
          // Clean the response to remove previous conversation duplicates
          const cleanedResponse = this.cleanDuplicateResponse(response.response || "No response received");
          
          // Create agent message with query response metadata
          const agentMessage: Message = {
            id: this.generateId(),
            content: cleanedResponse,
            timestamp: new Date(),
            sender: 'agent',
            queryResponse: {
              ...response,
              response: cleanedResponse // Store cleaned response
            }
          };

          this.addMessage(agentMessage);
        },
        error: (error) => {
          console.error('Subscription error:', error);
          this.setLoading(false);
          this.setConnectionStatus(false);
          
          const errorMessage: Message = {
            id: this.generateId(),
            content: "Sorry, I encountered an error while processing your request. Please check your connection and try again.",
            timestamp: new Date(),
            sender: 'agent'
          };

          this.addMessage(errorMessage);
        }
      });
  }

  /**
   * Query History Management
   */
  private addToHistory(response: QueryResponse): void {
    const history = this.queryHistorySubject.value;
    history.unshift(response);
    
    // Keep only last 50 queries
    if (history.length > 50) {
      history.pop();
    }
    
    this.queryHistorySubject.next(history);
    this.saveHistoryToStorage(history);
  }

  private saveHistoryToStorage(history: QueryResponse[]): void {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        localStorage.setItem('query_history', JSON.stringify(history));
      } catch (e) {
        console.error('Failed to save history:', e);
      }
    }
  }

  loadHistoryFromStorage(): void {
    if (typeof window !== 'undefined' && localStorage) {
      const stored = localStorage.getItem('query_history');
      if (stored) {
        try {
          const history = JSON.parse(stored);
          this.queryHistorySubject.next(history);
        } catch (e) {
          console.error('Failed to parse history:', e);
        }
      }
    }
  }

  clearHistory(): void {
    this.queryHistorySubject.next([]);
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.removeItem('query_history');
    }
  }

  /**
   * Replay a query from history
   */
  replayQuery(response: QueryResponse): void {
    if (response.query) {
      this.sendMessage(response.query);
    }
  }
}