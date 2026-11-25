import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Sale } from '../../models/model';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn"><ion-icon name="arrow-back-outline"></ion-icon></a>
      Sales Report
    </div>
    <div class="page-container">
      <button class="btn-primary" (click)="printReport()" style="margin-bottom: 16px;">Export PDF / Print</button>
      
      <table id="reportTable" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #7047F5; color: white; text-align: left;">
            <th style="padding: 8px;">Date</th>
            <th style="padding: 8px;">Customer</th>
            <th style="padding: 8px;">Total</th>
            <th style="padding: 8px;">Paid</th>
            <th style="padding: 8px;">Bal</th>
          </tr>
        </thead>
        <tbody>
          <!-- Added a safe navigation check and fallback -->
          <tr *ngFor="let s of (sales$ | async) || []" style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">{{ s.saleDate }}</td>
            <td style="padding: 8px;">{{ s.customerName }}</td>
            <td style="padding: 8px;">{{ s.totalAmount | currency }}</td>
            <td style="padding: 8px;">{{ s.amountPaid | currency }}</td>
            <td style="padding: 8px; color: red;">{{ s.balance | currency }}</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="(sales$ | async)?.length === 0" style="text-align: center; padding: 20px; color: #888;">
        No sales records found.
      </div>
    </div>
  `
})
export class SalesReportComponent implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  
  // Initialize as an empty Observable or undefined until we get the user ID
  sales$!: Observable<Sale[]>;

  ngOnInit() {
    // Listen for the auth state and fetch Firestore data only when we have the UID
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.sales$ = this.dataService.getSales(user.uid);
      } else {
        // Optional: handle logged-out state
        console.warn('No user logged in');
      }
    });
  }

  printReport() {
    const printContent = document.getElementById("reportTable");
    const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    
    // Inject CSS so the printed PDF looks clean and professional
    WindowPrt?.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #7047F5; color: white; text-align: left; padding: 8px; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .text-red { color: red; }
          </style>
        </head>
        <body>
          <h2>Sales Report</h2>
          ${printContent?.outerHTML || ''}
        </body>
      </html>
    `);
    WindowPrt?.document.close();
    WindowPrt?.focus();
    WindowPrt?.print();
    WindowPrt?.close();
  }
}