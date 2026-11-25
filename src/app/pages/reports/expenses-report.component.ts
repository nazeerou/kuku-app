import { Component, inject, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Sale, Stock, Expense, Flock } from '../../models/model';
import {
  FeedPurchase,
  FeedRecord
} from '../../services/data.service';

@Component({
  selector: 'app-expenses-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 3. Added schema to fix ion-icon error
  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn"><ion-icon name="arrow-back-outline"></ion-icon></a>
      Expenses Report
    </div>
    <div class="page-container">
      <button class="btn-primary" (click)="printReport()" style="margin-bottom: 16px;">Export PDF / Print</button>
      <table id="reportTable" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #7047F5; color: white; text-align: left;">
            <th style="padding: 8px;">Date</th>
            <th style="padding: 8px;">Category</th>
            <th style="padding: 8px;">Description</th>
            <th style="padding: 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of expenses$ | async" style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">{{ e.date }}</td>
            <td style="padding: 8px;">{{ e.category }}</td>
            <td style="padding: 8px;">{{ e.description }}</td>
            <td style="padding: 8px;">{{ e.amount | currency }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ExpensesReportComponent implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  expenses$ = this.dataService.getExpenses('PLACEHOLDER_UID');

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.expenses$ = this.dataService.getExpenses(user.uid);
    });
  }

  printReport() {
    const printContent = document.getElementById("reportTable");
    const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt?.document.write(printContent?.outerHTML || '');
    WindowPrt?.document.close();
    WindowPrt?.focus();
    WindowPrt?.print();
    WindowPrt?.close();
  }
}