import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { QueryResponse } from '../../models/chat.models';

@Component({
  selector: 'app-history-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar" [class.open]="isOpen">
      <div class="sidebar-header">
        <div class="header-content">
          <h3>📜 Query History</h3>
          <button 
            class="clear-btn" 
            (click)="clearHistory()" 
            *ngIf="history.length > 0"
            title="Clear all history">
            <span class="btn-icon">🗑️</span>
          </button>
        </div>
        <button class="close-btn" (click)="toggleSidebar()" *ngIf="isOpen">
          <span>✕</span>
        </button>
      </div>
      
      <div class="history-list">
        <div 
          *ngFor="let item of history; let i = index"
          class="history-item"
          (click)="onHistoryClick(item, i)"
          [class.selected]="selectedIndex === i"
          [class.success]="item.success"
          [class.error]="!item.success">
          
          <div class="history-content">
            <div class="history-query">{{ truncate(item.query || '', 60) }}</div>
            <div class="history-response" *ngIf="item.response">
              {{ truncate(item.response, 80) }}
            </div>
          </div>
          
          <div class="history-meta">
            <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            <div class="history-badges">
              <span class="badge" *ngIf="item.sqlQuery" title="Contains SQL">SQL</span>
              <span class="badge" *ngIf="item.dataPreview" title="Has data preview">Data</span>
              <span class="status-badge" [class.success]="item.success">
                {{ item.success ? '✓' : '✗' }}
              </span>
            </div>
          </div>
        </div>
        
        <div *ngIf="history.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p class="empty-title">No query history yet</p>
          <small class="empty-subtitle">Your queries will appear here</small>
        </div>
      </div>
    </div>
    
    <!-- Mobile toggle button -->
    <button class="sidebar-toggle" (click)="toggleSidebar()" *ngIf="!isOpen">
      <span class="toggle-icon">📜</span>
      <span class="toggle-count" *ngIf="history.length > 0">{{ history.length }}</span>
    </button>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: -320px;
      top: 0;
      width: 320px;
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      transition: left 0.3s ease-in-out;
      z-index: 1000;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
    }

    .sidebar.open {
      left: 0;
    }

    .sidebar-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .clear-btn,
    .close-btn {
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .clear-btn:hover,
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .close-btn {
      width: 100%;
      margin-top: 8px;
    }

    .btn-icon {
      font-size: 14px;
    }

    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .history-item {
      padding: 14px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-left: 3px solid #6c757d;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .history-item.success {
      border-left-color: #28a745;
    }

    .history-item.error {
      border-left-color: #dc3545;
    }

    .history-item:hover {
      background: #e9ecef;
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .history-item.selected {
      background: #e3f2fd;
      border-color: #2196f3;
      border-left-color: #2196f3;
    }

    .history-content {
      margin-bottom: 8px;
    }

    .history-query {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .history-response {
      font-size: 12px;
      color: #6c757d;
      line-height: 1.4;
    }

    .history-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #868e96;
    }

    .history-time {
      font-weight: 500;
    }

    .history-badges {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .badge {
      padding: 2px 6px;
      background: #dee2e6;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      color: #495057;
    }

    .status-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      background: #dc3545;
      color: white;
      font-weight: 600;
    }

    .status-badge.success {
      background: #28a745;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: #495057;
    }

    .empty-subtitle {
      font-size: 13px;
      color: #868e96;
    }

    .sidebar-toggle {
      position: fixed;
      left: 16px;
      bottom: 16px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      transition: transform 0.2s;
    }

    .sidebar-toggle:hover {
      transform: scale(1.1);
    }

    .toggle-icon {
      font-size: 24px;
    }

    .toggle-count {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #dc3545;
      color: white;
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      min-width: 20px;
    }

    /* Scrollbar styling */
    .history-list::-webkit-scrollbar {
      width: 6px;
    }

    .history-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .history-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .history-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Desktop view */
    @media (min-width: 1024px) {
      .sidebar {
        position: relative;
        left: 0;
        box-shadow: none;
      }

      .sidebar-toggle {
        display: none;
      }

      .close-btn {
        display: none;
      }
    }

    /* Tablet view */
    @media (min-width: 768px) and (max-width: 1023px) {
      .sidebar {
        width: 280px;
        left: -280px;
      }
    }

    /* Mobile view */
    @media (max-width: 767px) {
      .sidebar {
        width: 100%;
        left: -100%;
      }

      .sidebar.open {
        left: 0;
      }
    }
  `]
})
export class HistorySidebarComponent implements OnInit {
  @Output() historySelected = new EventEmitter<QueryResponse>();
  @Output() sidebarToggled = new EventEmitter<boolean>();
  
  history: QueryResponse[] = [];
  selectedIndex: number = -1;
  isOpen = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to query history
    this.chatService.queryHistory$.subscribe(history => {
      this.history = history;
    });
    
    // Load history from storage on init
    this.chatService.loadHistoryFromStorage();
  }

  onHistoryClick(item: QueryResponse, index: number): void {
    this.selectedIndex = index;
    this.historySelected.emit(item);
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      this.toggleSidebar();
    }
  }

  clearHistory(): void {
    if (confirm('Are you sure you want to clear all query history?')) {
      this.chatService.clearHistory();
      this.selectedIndex = -1;
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    this.sidebarToggled.emit(this.isOpen);
  }

  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatTime(timestamp?: Date): string {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }
}
