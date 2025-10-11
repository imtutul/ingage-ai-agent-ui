import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-input-container">
      <div class="input-wrapper">
        <textarea 
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          placeholder="Type your message..."
          class="message-input"
          rows="1"
          [disabled]="isDisabled"
        ></textarea>
        <button 
          (click)="sendMessage()"
          [disabled]="!messageText.trim() || isDisabled"
          class="send-button"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .message-input-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #E5E5EA;
      flex-shrink: 0;
    }

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      max-width: 100%;
    }

    .message-input {
      flex: 1;
      min-height: 40px;
      max-height: 120px;
      padding: 12px 16px;
      border: 1px solid #D1D1D6;
      border-radius: 20px;
      resize: none;
      font-family: inherit;
      font-size: 16px;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .message-input:focus {
      border-color: #007AFF;
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }

    .message-input:disabled {
      background-color: #F2F2F7;
      color: #8E8E93;
    }

    .message-input::placeholder {
      color: #8E8E93;
    }

    .send-button {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      border: none;
      background: #007AFF;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
      flex-shrink: 0;
    }

    .send-button:hover:not(:disabled) {
      background: #0051D0;
      transform: scale(1.05);
    }

    .send-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .send-button:disabled {
      background: #D1D1D6;
      cursor: not-allowed;
      transform: none;
    }

    .send-button svg {
      width: 20px;
      height: 20px;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .message-input-container {
        padding: 12px 16px;
      }
      
      .input-wrapper {
        gap: 10px;
      }
      
      .message-input {
        font-size: 16px; /* Prevent zoom on iOS */
        padding: 10px 14px;
      }
      
      .send-button {
        width: 36px;
        height: 36px;
      }
      
      .send-button svg {
        width: 18px;
        height: 18px;
      }
    }

    @media (max-width: 480px) {
      .message-input-container {
        padding: 10px 12px;
      }
      
      .input-wrapper {
        gap: 8px;
      }
      
      .message-input {
        padding: 8px 12px;
        min-height: 36px;
      }
      
      .send-button {
        width: 32px;
        height: 32px;
      }
      
      .send-button svg {
        width: 16px;
        height: 16px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .message-input-container {
        background: #1C1C1E;
        border-top-color: #38383A;
      }
      
      .message-input {
        background: #2C2C2E;
        border-color: #48484A;
        color: #FFFFFF;
      }
      
      .message-input:focus {
        border-color: #007AFF;
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
      }
      
      .message-input:disabled {
        background-color: #1C1C1E;
        color: #8E8E93;
      }
      
      .message-input::placeholder {
        color: #8E8E93;
      }
    }
  `]
})
export class MessageInputComponent {
  @Output() messageSent = new EventEmitter<string>();
  
  messageText = '';
  isDisabled = false;

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const trimmedMessage = this.messageText.trim();
    if (trimmedMessage) {
      this.messageSent.emit(trimmedMessage);
      this.messageText = '';
    }
  }
}