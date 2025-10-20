import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sql-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sql-container" *ngIf="sqlQuery">
      <div class="sql-header">
        <div class="header-left">
          <span class="sql-icon">📊</span>
          <h4>Generated SQL Query</h4>
        </div>
        <div class="header-right">
          <span class="sql-meta" *ngIf="stepsCount">{{ stepsCount }} steps</span>
          <span class="sql-meta" *ngIf="runStatus" [class.success]="runStatus === 'Completed'">
            {{ runStatus }}
          </span>
          <button class="copy-btn" (click)="copySql()" [class.copied]="copied">
            <span class="btn-icon">{{ copied ? '✅' : '📋' }}</span>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>
      
      <div class="sql-body">
        <pre class="sql-code"><code>{{ sqlQuery }}</code></pre>
      </div>
    </div>
  `,
  styles: [`
    .sql-container {
      margin-top: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .sql-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sql-icon {
      font-size: 20px;
    }

    .sql-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #2c3e50;
    }

    .sql-meta {
      font-size: 13px;
      color: #6c757d;
      padding: 4px 10px;
      background: white;
      border-radius: 12px;
      font-weight: 500;
    }

    .sql-meta.success {
      color: #28a745;
      background: #d4edda;
    }

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: white;
      color: #495057;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #f8f9fa;
      border-color: #007bff;
      color: #007bff;
    }

    .copy-btn.copied {
      background: #d4edda;
      border-color: #28a745;
      color: #28a745;
    }

    .btn-icon {
      font-size: 14px;
    }

    .sql-body {
      background: #1e1e1e;
      overflow-x: auto;
    }

    .sql-code {
      padding: 18px;
      margin: 0;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Scrollbar styling */
    .sql-code::-webkit-scrollbar {
      height: 8px;
    }

    .sql-code::-webkit-scrollbar-track {
      background: #2d2d2d;
    }

    .sql-code::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 4px;
    }

    .sql-code::-webkit-scrollbar-thumb:hover {
      background: #777;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .sql-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }

      .sql-code {
        font-size: 12px;
        padding: 14px;
      }
    }
  `]
})
export class SqlDisplayComponent {
  @Input() sqlQuery?: string;
  @Input() stepsCount?: number;
  @Input() runStatus?: string;
  
  copied = false;

  copySql(): void {
    if (this.sqlQuery && navigator.clipboard) {
      navigator.clipboard.writeText(this.sqlQuery).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy SQL:', err);
        // Fallback for older browsers
        this.fallbackCopy(this.sqlQuery!);
      });
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  }
}
