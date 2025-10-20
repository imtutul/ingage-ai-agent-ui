import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TableData {
  headers: string[];
  rows: string[][];
}

@Component({
  selector: 'app-data-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-preview" *ngIf="tableData && tableData.rows.length > 0">
      <div class="preview-header">
        <div class="header-left">
          <span class="preview-icon">📋</span>
          <h4>Data Preview</h4>
        </div>
        <div class="header-right">
          <span class="row-count">{{ tableData.rows.length }} rows</span>
        </div>
      </div>
      
      <div class="table-container">
        <table class="preview-table">
          <thead>
            <tr>
              <th *ngFor="let header of tableData.headers; let i = index" 
                  [class.first-col]="i === 0">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of tableData.rows; let rowIndex = index" 
                [class.even]="rowIndex % 2 === 0">
              <td *ngFor="let cell of row; let colIndex = index"
                  [class.first-col]="colIndex === 0">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="preview-footer">
        <span class="footer-text">
          <span class="footer-icon">ℹ️</span>
          Showing preview of query results
        </span>
      </div>
    </div>
  `,
  styles: [`
    .data-preview {
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

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-bottom: 1px solid #90caf9;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .preview-icon {
      font-size: 20px;
    }

    .preview-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1565c0;
    }

    .row-count {
      font-size: 13px;
      font-weight: 600;
      color: #1976d2;
      background: white;
      padding: 4px 12px;
      border-radius: 12px;
    }

    .table-container {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .preview-table thead {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #f8f9fa;
    }

    .preview-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
      color: #495057;
      background: #f8f9fa;
      white-space: nowrap;
    }

    .preview-table th.first-col {
      position: sticky;
      left: 0;
      z-index: 11;
      background: #e9ecef;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
    }

    .preview-table td {
      padding: 10px 16px;
      border-bottom: 1px solid #f0f0f0;
      color: #495057;
      white-space: nowrap;
    }

    .preview-table td.first-col {
      position: sticky;
      left: 0;
      background: #f8f9fa;
      font-weight: 500;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
    }

    .preview-table tr.even td {
      background: #fafafa;
    }

    .preview-table tr.even td.first-col {
      background: #f0f0f0;
    }

    .preview-table tr:hover td {
      background: #e3f2fd;
    }

    .preview-table tr:hover td.first-col {
      background: #bbdefb;
    }

    .preview-footer {
      padding: 10px 18px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
    }

    .footer-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6c757d;
    }

    .footer-icon {
      font-size: 14px;
    }

    /* Scrollbar styling */
    .table-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .table-container::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .table-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .preview-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .header-right {
        width: 100%;
      }

      .preview-table {
        font-size: 12px;
      }

      .preview-table th,
      .preview-table td {
        padding: 8px 12px;
      }

      .table-container {
        max-height: 300px;
      }
    }
  `]
})
export class DataPreviewComponent implements OnInit {
  @Input() dataPreview?: string[];
  
  tableData: TableData | null = null;

  ngOnInit(): void {
    if (this.dataPreview && this.dataPreview.length > 0) {
      this.parseDataPreview();
    }
  }

  private parseDataPreview(): void {
    if (!this.dataPreview || this.dataPreview.length === 0) {
      return;
    }

    try {
      // Assume CSV format: first row is headers, rest are data
      const rows = this.dataPreview.map(row => this.parseCSVRow(row));
      
      if (rows.length > 0) {
        this.tableData = {
          headers: rows[0],
          rows: rows.slice(1)
        };
      }
    } catch (error) {
      console.error('Failed to parse data preview:', error);
      // Fallback: treat each line as a single column
      this.tableData = {
        headers: ['Data'],
        rows: this.dataPreview.map(row => [row])
      };
    }
  }

  private parseCSVRow(row: string): string[] {
    // Simple CSV parser - handles quoted fields with commas
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    result.push(currentField.trim());
    
    return result;
  }
}
