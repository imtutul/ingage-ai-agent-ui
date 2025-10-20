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
   * Send query to authenticated API
   * API: POST /query
   * Requires: Authentication (cookie-based)
   */
  private sendToBackend(message: string): void {
    const requestPayload = {
      query: message
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
          // Create agent message with query response metadata
          const agentMessage: Message = {
            id: this.generateId(),
            content: response.response || "No response received",
            timestamp: new Date(),
            sender: 'agent',
            queryResponse: response  // Attach full query response
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