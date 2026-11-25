
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth, authState } from '@angular/fire/auth';

import {
  Firestore,
  collection,
  collectionData,
  query,
  where
} from '@angular/fire/firestore';

import {
  Subscription,
  of,
  switchMap,
  timeout,
  catchError
} from 'rxjs';

interface StockReportRow {
  id?: string;
  date: string;
  trays: number;
  eggs: number;
  brokenEggs: number;
}

@Component({
  selector: 'app-stock-report',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `

    <!-- Page Header -->
    <div class="page-header">

      <a routerLink="/home" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon>
      </a>

      <span>Stock Report</span>

    </div>

    <div class="page-container">

      <!-- Month and Year Filters -->
      <div class="filter-row">

        <select
          [(ngModel)]="selectedMonth"
          class="filter-select">

          <option value="">Select Month</option>

          <option
            *ngFor="let month of months"
            [value]="month.value">

            {{ month.name }}

          </option>

        </select>

        <select
          [(ngModel)]="selectedYear"
          class="filter-select">

          <option value="">Select Year</option>

          <option
            *ngFor="let year of years"
            [value]="year">

            {{ year }}

          </option>

        </select>

        <button
          class="search-btn"
          type="button"
          (click)="searchReport()">

          <ion-icon name="search-outline"></ion-icon>
          Search

        </button>

      </div>

      <!-- Report Heading -->
      <div class="report-title">

        Stock Summary:
        Month: {{ selectedMonth ? getMonthName(selectedMonth) : 'All' }}
        - Year: {{ selectedYear || 'All' }}

      </div>

      <div class="abbreviation">
        Abbreviations: T.T - Total Trays, T.E - Total Eggs (30 Eggs = 1 Tray)
      </div>

      <!-- Loading -->
      <div class="message" *ngIf="loading">
        Loading stock records...
      </div>

      <!-- Error -->
      <div class="error-message" *ngIf="!loading && errorMessage">
        {{ errorMessage }}
      </div>

      <!-- Stock Report Table -->
      <div
        class="table-wrapper"
        *ngIf="!loading && !errorMessage">

        <table>

          <thead>

            <tr>

              <th rowspan="2" class="date-column">
                Date
              </th>

              <th colspan="2">
                Plot - 1
              </th>

            </tr>

            <tr>

              <th>T.T</th>

              <th>T.E</th>

            </tr>

          </thead>

          <tbody>

            <tr *ngFor="let stock of paginatedStocks">

              <td class="date-column">
                {{ stock.date }}
              </td>

              <td>
                {{ stock.trays | number }}
              </td>

              <td>
                {{ stock.eggs | number }}
              </td>

            </tr>

            <tr *ngIf="filteredStocks.length === 0">

              <td colspan="3" class="empty-row">
                No stock records found.
              </td>

            </tr>

          </tbody>

          <!-- Table Totals -->
          <tfoot *ngIf="filteredStocks.length > 0">

            <tr>

              <th>Total</th>

              <th>{{ totalTrays | number }}</th>

              <th>{{ totalEggs | number }}</th>

            </tr>

          </tfoot>

        </table>

      </div>

      <!-- Pagination -->
      <div
        class="pagination"
        *ngIf="!loading && !errorMessage && filteredStocks.length > pageSize">

        <button
          type="button"
          (click)="previousPage()"
          [disabled]="currentPage === 1">

          Previous

        </button>

        <button
          type="button"
          *ngFor="let page of pages"
          (click)="goToPage(page)"
          [class.active]="currentPage === page">

          {{ page }}

        </button>

        <button
          type="button"
          (click)="nextPage()"
          [disabled]="currentPage === totalPages">

          Next »

        </button>

      </div>

      <!-- General Summary -->
      <div
        class="general-summary"
        *ngIf="!loading && !errorMessage">

        <div class="summary-heading">
          General Summary:
        </div>

        <ul>

          <li>
            Total Tray Collected (T.T):
            <strong>{{ totalTrays | number }}</strong>
          </li>

          <li>
            Total Eggs (T.E):
            <strong>{{ totalEggs | number }}</strong>
          </li>

          <li>
            Total Broken:
            <strong>{{ totalBroken | number }}</strong>
          </li>

        </ul>

      </div>

    </div>

  `,

  styles: [`

    * {
      box-sizing: border-box;
    }

    /* Header */
    .page-header {
      height: 36px;
      background: #7047F5;
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 10px;
      font-size: 12px;
      font-weight: 600;
    }

    .back-btn {
      color: white;
      display: flex;
      align-items: center;
      font-size: 16px;
      text-decoration: none;
    }

    /* Main Container */
    .page-container {
      background: #f4f4f4;
      min-height: calc(100vh - 36px);
      padding: 16px 8px;
    }

    /* Filters */
    .filter-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 8px;
      width: 100%;
      margin-bottom: 8px;
    }

    .filter-select {
      min-width: 0;
      width: 100%;
      height: 29px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 2px;
      padding: 0 5px;
      font-size: 10px;
      color: #444;
    }

    .search-btn {
      height: 29px;
      padding: 0 10px;
      background: #f58200;
      color: white;
      border: none;
      border-radius: 2px;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
      cursor: pointer;
    }

    .search-btn ion-icon {
      vertical-align: middle;
      margin-right: 3px;
    }

    /* Report Title */
    .report-title {
      background: white;
      border: 1px solid #ddd;
      box-shadow: 0 1px 2px #ddd;
      text-align: center;
      padding: 7px 3px;
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 7px;
    }

    .abbreviation {
      font-size: 8px;
      color: #555;
      margin: 5px 0 10px;
    }

    /* Table */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      background: white;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      background: white;
      font-size: 9px;
    }

    th,
    td {
      border: 1px solid #e1e1e1;
      padding: 6px 3px;
      text-align: center;
      overflow-wrap: anywhere;
    }

    thead th {
      background: white;
      color: #222;
      font-weight: bold;
    }

    thead tr:first-child th {
      padding: 7px 2px;
    }

    tbody tr:nth-child(even) {
      background: #f4f4f4;
    }

    .date-column {
      text-align: left;
      width: 34%;
    }

    tbody td:first-child {
      font-size: 8px;
    }

    tfoot th {
      background: white;
      font-weight: bold;
      border-top: 2px solid #777;
    }

    .empty-row {
      padding: 20px 5px;
      color: #888;
      text-align: center;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin: 10px 0 15px;
      flex-wrap: wrap;
    }

    .pagination button {
      border: none;
      background: transparent;
      color: #333;
      padding: 5px 7px;
      font-size: 10px;
      cursor: pointer;
    }

    .pagination button.active {
      background: #2196e8;
      color: white;
      border-radius: 2px;
    }

    .pagination button:disabled {
      color: #bbb;
      cursor: not-allowed;
    }

    /* General Summary */
    .general-summary {
      background: white;
      border: 1px solid #ddd;
      padding: 9px;
      margin-top: 14px;
      font-size: 9px;
    }

    .summary-heading {
      margin-bottom: 5px;
      font-weight: 600;
    }

    .general-summary ul {
      padding-left: 20px;
      margin: 0;
      line-height: 1.8;
    }

    /* Messages */
    .message {
      text-align: center;
      padding: 20px;
      font-size: 12px;
    }

    .error-message {
      background: white;
      border: 1px solid #e5aaaa;
      color: #b00020;
      padding: 12px;
      font-size: 11px;
    }

    @media (max-width: 350px) {

      .filter-row {
        gap: 4px;
      }

      .filter-select {
        font-size: 9px;
      }

      .search-btn {
        padding: 0 7px;
        font-size: 9px;
      }

    }

  `]

})

export class StockReportComponent implements OnInit, OnDestroy {

  private auth = inject(Auth);

  private firestore = inject(Firestore);

  private subscriptions = new Subscription();

  allStocks: StockReportRow[] = [];

  filteredStocks: StockReportRow[] = [];

  paginatedStocks: StockReportRow[] = [];

  loading = true;

  errorMessage = '';

  // Default current month and year
  selectedMonth = String(
    new Date().getMonth() + 1
  ).padStart(2, '0');

  selectedYear = String(
    new Date().getFullYear()
  );

  // Summary totals
  totalTrays = 0;

  totalEggs = 0;

  totalBroken = 0;

  // Pagination
  currentPage = 1;

  pageSize = 10;

  months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  years: number[] = [];

  get totalPages(): number {
    return Math.ceil(
      this.filteredStocks.length / this.pageSize
    );
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  // Automatically load current month's stock
  ngOnInit(): void {

    const now = new Date();

    this.years = Array.from(
      { length: 6 },
      (_, index) => now.getFullYear() - index
    );

    this.loadStocks();

  }

  // Load Firestore data
  private loadStocks(): void {

    this.loading = true;
    this.errorMessage = '';

    console.log('STOCK REPORT: Starting data loading...');

    const stockSubscription = authState(this.auth).pipe(

      timeout({ first: 15000 }),

      switchMap(user => {

        console.log('STOCK REPORT: Authentication:', user);

        if (!user) {

          this.allStocks = [];
          this.filteredStocks = [];
          this.paginatedStocks = [];

          this.errorMessage =
            'Please login to view stock records.';

          return of([]);

        }

        console.log('Authenticated UID:', user.uid);

        const stocksRef = collection(
          this.firestore,
          'stocks'
        );

        const stocksQuery = query(
          stocksRef,
          where('userId', '==', user.uid)
        );

        console.log('Requesting Firestore records...');

        return collectionData(stocksQuery, {
          idField: 'id'
        }).pipe(
          timeout({ first: 15000 })
        );

      }),

      catchError(error => {

        console.error('STOCK REPORT LOADING ERROR:', error);

        if (error.name === 'TimeoutError') {

          this.errorMessage =
            'Loading timed out. Firebase did not respond.';

        } else if (error.code === 'permission-denied') {

          this.errorMessage =
            'Firestore permission denied. Check your security rules.';

        } else {

          this.errorMessage =
            'Unable to load stock records: ' +
            (error.message || 'Unknown error');

        }

        return of([]);

      })

    ).subscribe({

      next: (records: any[]) => {

        console.log('Firestore stock records:', records);

        /*
         * IMPORTANT:
         * Convert every 30 eggs into 1 tray.
         * Keep only the remaining eggs in T.E.
         */

        this.allStocks = (records || []).map(stock => {

          const originalTrays = Number(stock.trays || 0);

          const originalEggs = Number(stock.eggs || 0);

          // Convert every 30 eggs into additional trays
          const additionalTrays = Math.floor(
            originalEggs / 30
          );

          // Remaining eggs after conversion
          const remainingEggs = originalEggs % 30;

          return {

            id: stock.id,

            date: this.formatDate(stock.date),

            // Original trays + converted trays
            trays: originalTrays + additionalTrays,

            // Remaining eggs only
            eggs: remainingEggs,

            brokenEggs: Number(stock.brokenEggs || 0)

          };

        });

        // Apply current month/year
        this.applyFilters();

        this.loading = false;

        console.log(
          'Loading completed. Records:',
          this.allStocks.length
        );

      },

      error: error => {

        console.error('STOCK REPORT SUBSCRIPTION ERROR:', error);

        this.errorMessage = 'Unable to load stock records.';

        this.loading = false;

      }

    });

    this.subscriptions.add(stockSubscription);

  }

  // Format Firestore date
  private formatDate(value: any): string {

    if (!value) return '';

    if (value?.toDate && typeof value.toDate === 'function') {
      value = value.toDate();
    } else if (value?.seconds) {
      value = new Date(value.seconds * 1000);
    }

    if (typeof value === 'string') {

      const match = value.match(/^\d{4}-\d{2}-\d{2}/);

      if (match) return match[0];

    }

    const date = new Date(value);

    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  // Search button
  searchReport(): void {

    this.currentPage = 1;

    this.applyFilters();

  }

  // Apply month and year filters
  private applyFilters(): void {

    this.filteredStocks = this.allStocks.filter(stock => {

      if (!stock.date) return false;

      const parts = stock.date.split('-');

      const year = parts[0];

      const month = parts[1];

      const monthMatches =
        !this.selectedMonth ||
        month === this.selectedMonth;

      const yearMatches =
        !this.selectedYear ||
        year === this.selectedYear;

      return monthMatches && yearMatches;

    });

    this.filteredStocks.sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    this.currentPage = 1;

    this.updateReport();

  }

  // Calculate table totals AND General Summary
  private updateReport(): void {

    /*
     * Both totals use the same converted records
     * displayed in the table.
     */

    // Total trays, including converted eggs
    this.totalTrays = this.filteredStocks.reduce(
      (total, stock) =>
        total + Number(stock.trays || 0),
      0
    );

    // Total remaining eggs after conversion
    this.totalEggs = this.filteredStocks.reduce(
      (total, stock) =>
        total + Number(stock.eggs || 0),
      0
    );

    // Total broken eggs
    this.totalBroken = this.filteredStocks.reduce(
      (total, stock) =>
        total + Number(stock.brokenEggs || 0),
      0
    );

    // Pagination
    const start =
      (this.currentPage - 1) * this.pageSize;

    this.paginatedStocks = this.filteredStocks.slice(
      start,
      start + this.pageSize
    );

  }

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.updateReport();

    }

  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.updateReport();

    }

  }

  goToPage(page: number): void {

    if (page >= 1 && page <= this.totalPages) {

      this.currentPage = page;

      this.updateReport();

    }

  }

  getMonthName(value: string): string {

    return this.months.find(
      month => month.value === value
    )?.name || '';

  }

  ngOnDestroy(): void {

    this.subscriptions.unsubscribe();

  }

}
