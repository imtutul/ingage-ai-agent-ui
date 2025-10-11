import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { Message, ChatState, ApiResponse } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_BASE_URL = 'http://localhost:8000'; // Update with your backend URL
  
  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true
  });

  public chatState$ = this.chatStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeChat();
  }

  private initializeChat(): void {
    const welcomeMessage: Message = {
      id: this.generateId(),
      content: 'Hello! I\'m your Ingage AI agent. I\'m here to help answer your questions and provide assistance. What can I help you with today?',
      timestamp: new Date(),
      sender: 'agent'
    };

    this.addMessage(welcomeMessage);
  }

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

  // Method for backend integration
  private sendToBackend(message: string): void {
    const requestPayload = {
      query: message
    };

    this.http.post<any>(`${this.API_BASE_URL}/query`, requestPayload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('API call failed:', error);
          this.setConnectionStatus(false);
          
          // Return a user-friendly error message
          return of({
            result: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
            error: true
          });
        })
      )
      .subscribe({
        next: (response: any) => {
          this.setConnectionStatus(true);
          this.setLoading(false);
          
          // Extract the response content - handle various response formats
          let responseContent = '';
          if (response.error && response.result) {
            responseContent = response.result;
          } else if (response.result) {
            responseContent = response.result;
          } else if (response.answer) {
            responseContent = response.answer;
          } else if (response.response) {
            responseContent = response.response;
          } else if (response.message) {
            responseContent = response.message;
          } else if (typeof response === 'string') {
            responseContent = response;
          } else {
            responseContent = "I received your message but couldn't generate a proper response. Please try again.";
          }

          const agentMessage: Message = {
            id: this.generateId(),
            content: responseContent,
            timestamp: new Date(),
            sender: 'agent'
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
}