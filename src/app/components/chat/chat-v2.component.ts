import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageComponent } from '../message/message.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { Message, User } from '../../models/chat.models';
import { ChatService } from '../../services/chat.service';
import { FabricAuthService } from '../../services/fabric-auth-v3-client.service';
import { Subscription } from 'rxjs';

/**
 * ChatComponent - Client-Side Authentication (v3.0.0)
 * 
 * Authentication Flow:
 * 1. On init: Check auth status
 * 2. If not authenticated: Show login button
 * 3. User clicks login: Open browser for Microsoft auth
 * 4. After login: Show chat interface
 * 5. User can send queries (authenticated)
 * 6. User can logout
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MessageComponent, MessageInputComponent],
  template: `
    <div class="chat-container">
      <!-- Header with authentication status -->
      <div class="chat-header">
        <div class="header-left">
          <h2>🤖 inGAGE IQ</h2>
          <!-- <span class="version">v2.0.0</span> -->
        </div>
        
        <div class="header-right">
          <!-- Loading authentication state -->
          <div *ngIf="authState === 'checking'" class="auth-status">
            <span class="status-indicator checking">🔄</span>
            <span>Checking authentication...</span>
          </div>
          
          <!-- Not authenticated - show login button -->
          <div *ngIf="authState === 'unauthenticated'" class="auth-status">
            <button class="login-btn" (click)="onLogin()">
              <span class="btn-icon">🔐</span>
              Sign In with Microsoft
            </button>
          </div>
          
          <!-- Logging in state -->
          <div *ngIf="authState === 'logging-in'" class="auth-status">
            <span class="status-indicator logging-in">⏳</span>
            <span>Signing in...</span>
          </div>
          
          <!-- Authenticated - show user info and logout -->
          <div *ngIf="authState === 'authenticated' && currentUser" class="auth-status authenticated">
            <div class="user-info">
              <span class="user-icon">👤</span>
              <div class="user-details">
                <span class="user-name">{{ currentUser.displayName || currentUser.email }}</span>
                <span class="user-email">{{ currentUser.email }}</span>
              </div>
            </div>
            <button class="logout-btn" (click)="onLogout()" title="Sign Out">
              <span class="btn-icon">🚪</span>
              Sign Out
            </button>
          </div>
          
          <!-- Error state -->
          <div *ngIf="authState === 'error'" class="auth-status error">
            <span class="status-indicator error">❌</span>
            <span>Authentication error</span>
            <button class="retry-btn" (click)="onRetry()">Retry</button>
          </div>
        </div>
      </div>
      
      <!-- Main chat area -->
      <div class="messages-container" #messagesContainer>
        <!-- Not authenticated message -->
        <div *ngIf="authState === 'unauthenticated'" class="auth-required-overlay">
          <div class="auth-required-content">
            <div class="auth-icon">🔐</div>
            <h3>Authentication Required</h3>
            <p>Please sign in with your Microsoft account to start using the AI Agent.</p>
            <button class="login-btn-large" (click)="onLogin()">
              <span class="btn-icon">🔐</span>
              Sign In with Microsoft
            </button>
            <p class="auth-help-text">
              A browser window will open for secure authentication.
            </p>
          </div>
        </div>
        
        <!-- Authentication in progress -->
        <div *ngIf="authState === 'logging-in'" class="auth-required-overlay">
          <div class="auth-required-content">
            <div class="auth-icon-animated">⏳</div>
            <h3>Authentication in Progress</h3>
            <p>Please complete the sign-in process in the browser window that just opened.</p>
            <p class="auth-help-text">
              If the browser window didn't open, <a href="javascript:void(0)" (click)="onLogin()">click here</a> to try again.
            </p>
          </div>
        </div>
        
        <!-- Messages list (shown when authenticated) -->
        <div class="messages-list" *ngIf="authState === 'authenticated'">
          <app-message 
            *ngFor="let message of messages" 
            [message]="message">
          </app-message>
          
          <div *ngIf="isTyping" class="typing-indicator">
            <div class="typing-bubble">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message input (only shown when authenticated) -->
      <app-message-input 
        *ngIf="authState === 'authenticated'"
        (messageSent)="onMessageSent($event)"
        [isLoading]="isTyping"
        [class.disabled]="!isConnected">
      </app-message-input>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: white;
    }

    .chat-header {
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-left h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .version {
      font-size: 11px;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .auth-status {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }

    .auth-status.authenticated {
      background: rgba(255,255,255,0.15);
      padding: 8px 16px;
      border-radius: 24px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-icon {
      font-size: 24px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
    }

    .user-email {
      font-size: 12px;
      opacity: 0.9;
    }

    .login-btn, .logout-btn, .retry-btn {
      padding: 8px 16px;
      border: 2px solid white;
      border-radius: 20px;
      background: transparent;
      color: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .login-btn:hover, .logout-btn:hover, .retry-btn:hover {
      background: white;
      color: #667eea;
    }

    .btn-icon {
      font-size: 16px;
    }

    .status-indicator {
      font-size: 18px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      background: #f8f9fa;
      position: relative;
    }

    .auth-required-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .auth-required-content {
      text-align: center;
      max-width: 500px;
      padding: 40px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .auth-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }

    .auth-icon-animated {
      font-size: 64px;
      margin-bottom: 24px;
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .auth-required-content h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 24px;
    }

    .auth-required-content p {
      color: #666;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }

    .login-btn-large {
      padding: 14px 32px;
      border: none;
      border-radius: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .login-btn-large:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    .auth-help-text {
      font-size: 13px;
      color: #999;
      margin-top: 16px;
    }

    .auth-help-text a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .messages-list {
      padding: 20px;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .typing-indicator {
      display: flex;
      justify-content: flex-start;
      margin: 10px 0;
      animation: fadeIn 0.3s ease-in;
    }

    .typing-bubble {
      background: #e9ecef;
      padding: 12px 16px;
      border-radius: 18px;
      border-bottom-left-radius: 6px;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: #6c757d;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .user-details {
        display: none;
      }
      
      .auth-required-content {
        padding: 24px;
        margin: 16px;
      }
    }
  `]
})
export class ChatComponentV2 implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: Message[] = [];
  isTyping = false;
  isConnected = true;
  
  // Authentication state
  authState: 'checking' | 'authenticated' | 'unauthenticated' | 'logging-in' | 'error' = 'checking';
  currentUser: User | null = null;
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: FabricAuthService
  ) {}

  ngOnInit(): void {
    console.log('💬 ChatComponent v2.0.0: Initialized');
    
    // Subscribe to chat state
    this.subscriptions.push(
      this.chatService.chatState$.subscribe(state => {
        this.messages = state.messages;
        this.isTyping = state.isLoading;
        this.isConnected = state.isConnected;
        this.shouldScrollToBottom = true;
      })
    );
    
    // Subscribe to authentication state
    this.subscriptions.push(
      this.authService.authStatus$.subscribe(status => {
        if (status.authenticated) {
          this.authState = 'authenticated';
          this.chatService.setAuthenticationState(true, status.user);
        } else if (this.authState !== 'logging-in') {
          this.authState = 'unauthenticated';
          this.chatService.setAuthenticationState(false);
        }
      })
    );
    
    // Subscribe to current user
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
    
    // Check authentication status on init
    this.checkAuthentication();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Check authentication status on component init
   */
  private checkAuthentication(): void {
    this.authState = 'checking';
    
    this.authService.checkAuthenticationStatus().subscribe({
      next: (status) => {
        if (status.authenticated) {
          console.log('✅ Already authenticated');
          this.authState = 'authenticated';
        } else {
          console.log('❌ Not authenticated');
          this.authState = 'unauthenticated';
        }
      },
      error: (error) => {
        console.error('❌ Auth check failed:', error);
        this.authState = 'error';
      }
    });
  }

  /**
   * Handle login button click
   * Opens browser for user delegation authentication
   */
  onLogin(): void {
    this.authState = 'logging-in';
    
    this.authService.login().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Login successful');
          this.authState = 'authenticated';
        } else {
          console.error('❌ Login failed:', response.message);
          // Return to unauthenticated state so user can retry
          this.authState = 'unauthenticated';
        }
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        // Return to unauthenticated state so user can retry
        this.authState = 'unauthenticated';
      }
    });
  }

  /**
   * Handle logout button click
   */
  onLogout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout().subscribe({
        next: () => {
          console.log('✅ Logged out successfully');
          this.authState = 'unauthenticated';
          this.chatService.clearChat();
        },
        error: (error) => {
          console.error('❌ Logout error:', error);
          // Still clear state even if logout failed
          this.authState = 'unauthenticated';
          this.chatService.clearChat();
        }
      });
    }
  }

  /**
   * Handle retry after error
   */
  onRetry(): void {
    this.checkAuthentication();
  }

  /**
   * Handle message sent from input
   */
  onMessageSent(message: string): void {
    if (this.authState === 'authenticated' && message.trim()) {
      this.chatService.sendMessage(message);
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }
}
