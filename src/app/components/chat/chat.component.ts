import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageComponent } from '../message/message.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { Message, ChatState } from '../../models/chat.models';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MessageComponent, MessageInputComponent],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>Ingage AI Agent</h2>
        <div class="status-indicator" [ngClass]="{'online': isConnected, 'offline': !isConnected}">
          {{ isConnected ? 'Online' : 'Offline' }}
        </div>
      </div>
      
      <div class="messages-container" #messagesContainer>
        <div class="messages-list">
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
      
      <app-message-input 
        (messageSent)="onMessageSent($event)"
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
      max-width: 100%;
    }

    .chat-header {
      padding: 16px 20px;
      background: #F8F9FA;
      border-bottom: 1px solid #E5E5EA;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .chat-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1D1D1F;
    }

    .status-indicator {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .status-indicator.online {
      background: #E8F5E8;
      color: #30D158;
    }

    .status-indicator.offline {
      background: #FFEAEA;
      color: #FF3B30;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 0 20px;
      background: #FFFFFF;
    }

    .messages-list {
      padding: 20px 0;
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
      background: #F2F2F7;
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
      background: #8E8E93;
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

    .disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .chat-header {
        padding: 12px 16px;
      }
      
      .chat-header h2 {
        font-size: 16px;
      }
      
      .messages-container {
        padding: 0 16px;
      }
      
      .messages-list {
        padding: 16px 0;
      }
    }

    @media (max-width: 480px) {
      .chat-header {
        padding: 10px 12px;
      }
      
      .messages-container {
        padding: 0 12px;
      }
      
      .messages-list {
        padding: 12px 0;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .chat-container {
        background: #1C1C1E;
      }
      
      .chat-header {
        background: #2C2C2E;
        border-bottom-color: #38383A;
      }
      
      .chat-header h2 {
        color: #FFFFFF;
      }
      
      .messages-container {
        background: #1C1C1E;
      }
      
      .typing-bubble {
        background: #2C2C2E;
      }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatState: ChatState = {
    messages: [],
    isLoading: false,
    isConnected: true
  };
  
  private chatSubscription!: Subscription;
  private shouldScrollToBottom = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatSubscription = this.chatService.chatState$.subscribe(state => {
      this.chatState = state;
      this.shouldScrollToBottom = true;
    });
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  onMessageSent(content: string): void {
    this.chatService.sendMessage(content);
  }

  get messages(): Message[] {
    return this.chatState.messages;
  }

  get isConnected(): boolean {
    return this.chatState.isConnected;
  }

  get isTyping(): boolean {
    return this.chatState.isLoading;
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}