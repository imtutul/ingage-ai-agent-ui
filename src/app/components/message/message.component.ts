import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/chat.models';
import { SqlDisplayComponent } from '../sql-display/sql-display.component';
import { DataPreviewComponent } from '../data-preview/data-preview.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, SqlDisplayComponent, DataPreviewComponent],
  template: `
    <div class="message-container fade-in" [ngClass]="{'user-message': message.sender === 'user', 'agent-message': message.sender === 'agent'}">
      <div class="message-bubble">
        <div class="message-content">{{ message.content }}</div>
        <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
      </div>
      
      <!-- SQL Display (only for agent messages with query response) -->
      <app-sql-display 
        *ngIf="message.sender === 'agent' && message.queryResponse?.sqlQuery"
        [sqlQuery]="message.queryResponse!.sqlQuery"
        [stepsCount]="message.queryResponse!.stepsCount"
        [runStatus]="message.queryResponse!.runStatus">
      </app-sql-display>
      
      <!-- Data Preview (only for agent messages with data) -->
      <app-data-preview
        *ngIf="message.sender === 'agent' && message.queryResponse?.dataPreview"
        [dataPreview]="message.queryResponse!.dataPreview">
      </app-data-preview>
    </div>
  `,
  styles: [`
    .message-container {
      margin: 10px 0;
      display: flex;
    }

    .user-message {
      justify-content: flex-end;
    }

    .agent-message {
      justify-content: flex-start;
    }

    .message-bubble {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      position: relative;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .user-message .message-bubble {
      background: linear-gradient(135deg, #007AFF, #0051D0);
      color: white;
      border-bottom-right-radius: 6px;
    }

    .agent-message .message-bubble {
      background: #F2F2F7;
      color: #000;
      border-bottom-left-radius: 6px;
      border: 1px solid #E5E5EA;
    }

    .message-content {
      margin-bottom: 4px;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message-timestamp {
      font-size: 11px;
      opacity: 0.7;
      text-align: right;
    }

    .agent-message .message-timestamp {
      text-align: left;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .message-bubble {
        max-width: 85%;
        padding: 10px 14px;
      }
    }

    @media (max-width: 480px) {
      .message-bubble {
        max-width: 90%;
        padding: 8px 12px;
      }
      
      .message-timestamp {
        font-size: 10px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .agent-message .message-bubble {
        background: #2C2C2E;
        color: #FFFFFF;
        border-color: #38383A;
      }
      
      .message-bubble {
        box-shadow: 0 1px 2px rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class MessageComponent {
  @Input() message!: Message;

  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}