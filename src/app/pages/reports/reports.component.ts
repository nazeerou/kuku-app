import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  NgZone,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ReportsService } from '../../services/reports.services';

import {
  ReportData,
  ReportPeriod,
  ReportDateRange,
  BusinessReportSummary,
  FeedCostSummary
} from '../../models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {

  // ==========================================
  // DEPENDENCIES
  // ==========================================

  private authService    = inject(AuthService);
  private reportsService = inject(ReportsService);

  private ngZone = inject(NgZone);
  private cdr    = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  // ==========================================
  // STATE
  // ==========================================

  reportData: ReportData | null = null;

  // ---- Monthly is the default period ----
  selectedPeriod: ReportPeriod = 'month';

  // Initialize to current-month range at construction time.
  startDate = this.formatDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  endDate = this.formatDate(new Date());

  today = new Date();

  isLoading = true;
  errorMessage = '';

  summary: BusinessReportSummary = this.emptySummary();

  feedCosts: FeedCostSummary[] = [];

  salesByProduct: {
    product: string;
    quantity: number;
    revenue: number;
  }[] = [];

  expensesByCategory: {
    category: string;
    amount: number;
  }[] = [];

  // ==========================================
  // LIFECYCLE
  // ==========================================

  ngOnInit(): void {

    // ==========================================
    // Load monthly report as default
    // ==========================================

    this.setPeriod('month');

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: user => {

          this.ngZone.run(() => {

            if (!user?.uid) {

              this.isLoading = false;
              this.errorMessage = 'Please log in to view reports.';
              this.cdr.detectChanges();
              return;

            }

            this.loadReports(user.uid);

          });

        },

        error: error => {

          console.error('Authentication error:', error);

          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Unable to verify your account.';
            this.cdr.detectChanges();
          });

        }

      });

  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

  // ==========================================
  // LOAD REPORT DATA
  // ==========================================

  private loadReports(userId: string): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.reportsService.getReportData(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: data => {

          this.ngZone.run(() => {

            this.reportData = data;

            // Ensure a period is applied on first render.
            // If dates aren't set for any reason, fall back
            // to the monthly default. Otherwise just refresh.
            if (!this.startDate || !this.endDate) {
              this.setPeriod('month');
            } else {
              this.updateReport();
            }

            this.isLoading = false;
            this.cdr.detectChanges();

          });

        },

        error: error => {

          console.error('Reports loading error:', error);

          this.ngZone.run(() => {
            this.errorMessage =
              'Failed to load business reports. Please try again.';
            this.isLoading = false;
            this.cdr.detectChanges();
          });

        }

      });

  }

  // ==========================================
  // PERIOD FILTERS
  // ==========================================

  setPeriod(period: ReportPeriod): void {

    this.selectedPeriod = period;

    const today = new Date();

    let start = new Date(today);
    const end = new Date(today);

    if (period === 'today') {

      // current day only

    } else if (period === 'week') {

      const day = today.getDay();
      const difference = day === 0 ? 6 : day - 1;
      start.setDate(today.getDate() - difference);

    } else if (period === 'month') {

      start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    } else if (period === 'year') {

      start = new Date(
        today.getFullYear(),
        0,
        1
      );

    }

    if (period !== 'custom') {

      this.startDate = this.formatDate(start);
      this.endDate   = this.formatDate(end);

      this.updateReport();

    }

  }

  onCustomDateChange(): void {

    if (!this.startDate || !this.endDate) {
      return;
    }

    if (this.startDate > this.endDate) {

      this.errorMessage = 'Start date cannot be after end date.';
      return;

    }

    this.selectedPeriod = 'custom';

    this.errorMessage = '';

    this.updateReport();

  }

  private formatDate(date: Date): string {

    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  get dateRange(): ReportDateRange {
    return { startDate: this.startDate, endDate: this.endDate };
  }

  // ==========================================
  // UPDATE DASHBOARD
  // ==========================================

  updateReport(): void {

    if (!this.reportData || !this.startDate || !this.endDate) {
      return;
    }

    this.summary =
      this.reportsService.calculateSummary(
        this.reportData,
        this.dateRange
      );

    const filteredFeedRecords =
      this.reportData.feedRecords.filter(record =>
        record.feedingDate >= this.startDate &&
        record.feedingDate <= this.endDate
      );

    this.feedCosts =
      this.reportsService.calculateFeedCosts(
        this.reportData.feedPurchases,
        filteredFeedRecords
      );

    const filteredSales =
      this.reportData.sales.filter(sale =>
        sale.saleDate >= this.startDate &&
        sale.saleDate <= this.endDate
      );

    const filteredExpenses =
      this.reportData.expenses.filter(expense =>
        expense.date >= this.startDate &&
        expense.date <= this.endDate
      );

    this.salesByProduct =
      this.reportsService.getSalesByProduct(filteredSales);

    this.expensesByCategory =
      this.reportsService.getExpensesByCategory(filteredExpenses);

  }

  // ==========================================
  // SUMMARY DEFAULT
  // ==========================================

  private emptySummary(): BusinessReportSummary {
    return {
      totalRevenue: 0,
      amountCollected: 0,
      outstandingBalance: 0,
      totalExpenses: 0,
      feedCost: 0,
      otherExpenses: 0,
      netProfit: 0,
      totalEggs: 0,
      brokenEggs: 0,
      netEggs: 0,
      totalTrays: 0,
      totalSales: 0,
      feedPurchasedKg: 0,
      feedConsumedKg: 0
    };
  }

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  get profitMargin(): number {

    if (this.summary.totalRevenue <= 0) {
      return 0;
    }

    return (this.summary.netProfit / this.summary.totalRevenue) * 100;

  }

  get maxSalesProductRevenue(): number {
    return Math.max(1, ...this.salesByProduct.map(i => i.revenue));
  }

  get maxExpenseCategoryAmount(): number {
    return Math.max(1, ...this.expensesByCategory.map(i => i.amount));
  }

  // ==========================================
  // EXPORT CSV
  // ==========================================

  exportCSV(): void {

    const rows: string[][] = [
      ['BUSINESS REPORT'],
      ['Start Date', this.startDate],
      ['End Date', this.endDate],
      [],
      ['PROFIT AND LOSS'],
      ['Total Sales Revenue', String(this.summary.totalRevenue)],
      ['Feed Consumption Cost', String(this.summary.feedCost)],
      ['Other Expenses', String(this.summary.otherExpenses)],
      ['Total Expenses', String(this.summary.totalExpenses)],
      ['Net Profit', String(this.summary.netProfit)],
      [],
      ['SALES'],
      ['Product', 'Quantity', 'Revenue'],
      ...this.salesByProduct.map(i => [
        i.product, String(i.quantity), String(i.revenue)
      ]),
      [],
      ['FEED CONSUMPTION'],
      ['Feed Type', 'Consumed Kg', 'Average Price/Kg', 'Consumed Cost'],
      ...this.feedCosts.map(i => [
        i.feedType,
        String(i.consumedKg),
        String(i.averagePricePerKg),
        String(i.consumedCost)
      ]),
      [],
      ['EXPENSES'],
      ['Category', 'Amount'],
      ...this.expensesByCategory.map(i => [
        i.category, String(i.amount)
      ]),
      [],
      ['EGG PRODUCTION'],
      ['Total Eggs', String(this.summary.totalEggs)],
      ['Broken Eggs', String(this.summary.brokenEggs)],
      ['Net Eggs', String(this.summary.netEggs)],
      ['Equivalent Trays', String(this.summary.totalTrays)]
    ];

    const csv = rows
      .map(row =>
        row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIVORA-Report-${this.startDate}-to-${this.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

  }

  // ==========================================
  // PRINT / SAVE AS PDF
  // ==========================================

  printReport(): void {
    window.print();
  }

}