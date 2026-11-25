import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Auth, authState } from '@angular/fire/auth';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

interface ExpenseEntry {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  date: string;
  createdAt?: any;
  updatedAt?: any;
}

interface ExpenseGroup {
  date: string;         // "2026-11-24"
  displayDate: string;  // "Nov 24, 2026"
  total: number;
  items: ExpenseEntry[];
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon>
      </a>
      Expenses
    </div>

    <div class="page-container">

      <!-- Top Action Bar -->
      <div class="action-bar">
        <button
          class="btn-add"
          type="button"
          (click)="toggleForm()">

          <ion-icon
            [name]="showForm ? 'remove-outline' : 'add-outline'">
          </ion-icon>

           Expense
        </button>
      </div>

      <!-- FORM VIEW -->
      <form
        *ngIf="showForm"
        [formGroup]="expenseForm"
        (ngSubmit)="saveExpense()">

        <div class="section-header">
          {{ editingId ? 'Edit Expense Info' : 'Record Expenses Info' }}
        </div>

        <div class="input-row single-col">
          <div class="input-wrapper">
            <input
              type="text"
              formControlName="name"
              placeholder="Name of Expense(s)" />
          </div>
        </div>

        <div class="input-row single-col">
          <div class="input-wrapper">
            <input
              type="number"
              formControlName="amount"
              placeholder="Amount"
              min="0" />
          </div>
        </div>

        <div class="input-row single-col">
          <div class="input-wrapper">
            <input
              type="date"
              formControlName="date" />
          </div>
        </div>

        <button
          type="submit"
          class="btn-save"
          [disabled]="saving">

          {{
            saving
              ? 'Please wait...'
              : editingId
                ? 'Update Expense'
                : 'Save'
          }}

        </button>

        <button
          type="button"
          class="btn-cancel"
          (click)="cancelForm()">

          Cancel

        </button>

      </form>

      <!-- LIST VIEW - DEFAULT -->
      <div *ngIf="!showForm" class="list-view">

        <div class="list-header">
          Expenses Summary -
          <span class="month-selector">
            [ {{ getMonthName(appliedMonth) }} {{ appliedYear }} ]
          </span>
        </div>

        <!-- MONTH / YEAR FILTER -->
        <div class="filter-bar" [formGroup]="filterForm">

          <div class="filter-field">
            <label>Month</label>

            <select formControlName="month">
              <option
                *ngFor="let month of months; let i = index"
                [ngValue]="i + 1">
                {{ month }}
              </option>
            </select>
          </div>

          <div class="filter-field">
            <label>Year</label>

            <select formControlName="year">
              <option
                *ngFor="let year of yearOptions"
                [ngValue]="year">
                {{ year }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="btn-search"
            [disabled]="loading"
            (click)="applyFilter()">

            <ion-icon name="search-outline"></ion-icon>

            Search

          </button>

        </div>

        <!-- LOADING -->
        <div *ngIf="loading" class="empty-state">
          <p>Loading expense records...</p>
        </div>

        <!-- GROUPED BY DATE -->
        <ng-container *ngIf="!loading">

          <div
            class="date-group"
            *ngFor="let group of groupedExpenses">

            <!-- DATE HEADER + TOTAL -->
            <div class="date-group-header">

              <span class="date-label">
                <ion-icon name="calendar-outline"></ion-icon>
                {{ group.displayDate }}
              </span>

              <span class="date-total">
                Total: {{ group.total | number:'1.0-0' }}
              </span>

            </div>

            <!-- RECORDS IN THIS DATE GROUP -->
            <div
              class="list-card"
              *ngFor="let item of group.items">

              <div class="list-row">

                <span class="label">
                  {{ item.name }}
                </span>

                <span class="amount">
                  {{ item.amount | number:'1.0-0' }}
                </span>

                <!-- ACTIONS (still per record) -->
                <div class="item-actions">

                  <ion-icon
                    name="pencil"
                    class="edit-icon"
                    title="Edit"
                    (click)="editExpense(item)">
                  </ion-icon>

                  <ion-icon
                    name="trash-outline"
                    class="delete-icon"
                    title="Delete"
                    (click)="deleteExpense(item.id!)">
                  </ion-icon>

                </div>

              </div>

            </div>

          </div>

          <!-- EMPTY STATE -->
          <div
            *ngIf="groupedExpenses.length === 0"
            class="empty-state">

            <ion-icon name="file-tray-outline"></ion-icon>

            <p *ngIf="expenseEntries.length === 0">
              No expense records found.
            </p>

            <p *ngIf="expenseEntries.length > 0">
              No expense records found for
              {{ getMonthName(appliedMonth) }} {{ appliedYear }}.
            </p>

          </div>

        </ng-container>

      </div>

    </div>
  `,

  styles: [`

    .page-header {
      background-color: #6a3de8;
      color: white;
      padding: 15px;
      display: flex;
      align-items: center;
      font-weight: bold;
      font-size: 16px;
    }

    .back-btn {
      color: white;
      margin-right: 15px;
      text-decoration: none;
      font-size: 20px;
      display: flex;
      align-items: center;
    }

    .page-container {
      background-color: #f4f4f4;
      min-height: 100vh;
      padding-bottom: 20px;
    }

    .action-bar {
      display: flex;
      justify-content: flex-end;
      padding: 15px;
    }

    .btn-add {
      background-color: #f39c12;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
    }

    .section-header {
      background-color: #e0e0e0;
      padding: 10px 15px;
      color: #555;
      font-weight: 500;
      margin-top: 10px;
    }

    .input-row {
      display: flex;
      gap: 15px;
      padding: 10px 15px;
      background-color: #f4f4f4;
    }

    .input-row.single-col {
      padding-top: 5px;
      padding-bottom: 5px;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .input-row input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
      outline: none;
      font-size: 14px;
    }

    .btn-save {
      display: block;
      width: calc(100% - 30px);
      margin: 20px 15px 10px;
      padding: 15px;
      background-color: #f39c12;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      display: block;
      width: calc(100% - 30px);
      margin: 0 15px 15px;
      padding: 12px;
      background: white;
      color: #666;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }

    /* List View */

    .list-view {
      padding: 0 15px;
    }

    .list-header {
      font-size: 14px;
      color: #333;
      margin-bottom: 12px;
      background: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .month-selector {
      font-weight: bold;
    }

    /* MONTH / YEAR FILTER */

    .filter-bar {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .filter-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .filter-field label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }

    .filter-field select {
      width: 100%;
      box-sizing: border-box;
      padding: 9px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      outline: none;
      font-size: 14px;
    }

    .btn-search {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: #6a3de8;
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-search:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-search ion-icon {
      font-size: 16px;
    }

    /* DATE GROUP */

    .date-group {
      margin-bottom: 16px;
    }

    .date-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #e0e0e0;
      color: #555;
      padding: 8px 12px;
      border-radius: 4px 4px 0 0;
      font-size: 13px;
      font-weight: bold;
    }

    .date-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .date-label ion-icon {
      font-size: 16px;
    }

    .date-total {
      color: #6a3de8;
    }

    /* CARDS */

    .list-card {
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0;
      padding: 12px 15px;
      margin-bottom: 0;
      box-shadow: none;
    }

    .list-card:last-child {
      border-radius: 0 0 4px 4px;
      margin-bottom: 0;
    }

    .list-card + .list-card {
      border-top: 1px solid #eee;
    }

    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .label {
      color: #333;
      font-size: 14px;
      flex: 1;
    }

    .amount {
      color: #333;
      font-size: 14px;
      margin-right: 5px;
      white-space: nowrap;
      font-weight: bold;
    }

    /* ACTION ICONS */

    .item-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 5px;
    }

    .edit-icon {
      color: #555;
      font-size: 18px;
      cursor: pointer;
    }

    .delete-icon {
      color: #d9534f;
      font-size: 18px;
      cursor: pointer;
    }

    /* Empty State */

    .empty-state {
      text-align: center;
      padding: 30px;
      background: white;
      color: #888;
      border-radius: 5px;
    }

    .empty-state ion-icon {
      font-size: 35px;
    }

  `]
})

export class ExpensesComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);

  private firestore = inject(Firestore);

  private auth = inject(Auth);

  private zone = inject(NgZone);

  private cdr = inject(ChangeDetectorRef);

  private authSubscription?: Subscription;

  private expensesSubscription?: Subscription;

  expenseForm!: FormGroup;

  filterForm!: FormGroup;

  showForm = false;

  editingId: string | null = null;

  userId = '';

  expenseEntries: ExpenseEntry[] = [];

  // Records grouped by date and filtered to the selected month/year
  groupedExpenses: ExpenseGroup[] = [];

  loading = true;

  saving = false;

  // ======================================
  // MONTH / YEAR FILTER STATE
  // ======================================

  readonly months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  yearOptions: number[] = [];

  // The filter that is ACTUALLY APPLIED (only changes on Search)
  appliedMonth: number = new Date().getMonth() + 1;

  appliedYear: number = new Date().getFullYear();

  // ======================================
  // INITIALIZE COMPONENT
  // ======================================

  ngOnInit(): void {

    this.initForm();

    this.initFilterForm();

    this.loading = true;

    this.authSubscription = authState(this.auth).subscribe({

      next: user => {

        this.zone.run(() => {

          this.expensesSubscription?.unsubscribe();

          if (!user) {

            this.userId = '';

            this.expenseEntries = [];

            this.groupedExpenses = [];

            this.loading = false;

            this.cdr.detectChanges();

            return;

          }

          this.userId = user.uid;

          console.log('Expense User ID:', this.userId);

          this.loadExpenses();

        });

      },

      error: error => {

        console.error('Authentication error:', error);

        this.zone.run(() => {

          this.loading = false;

          this.cdr.detectChanges();

        });

      }

    });

  }

  // ======================================
  // INITIALIZE FORM
  // ======================================

  initForm(): void {

    this.expenseForm = this.fb.group({

      name: ['', Validators.required],

      amount: ['', [
        Validators.required,
        Validators.min(0)
      ]],

      date: [
        this.getTodayDate(),
        Validators.required
      ]

    });

  }

  // ======================================
  // INITIALIZE FILTER FORM (DEFAULT = CURRENT MONTH)
  // ======================================

  initFilterForm(): void {

    const today = new Date();

    this.appliedMonth = today.getMonth() + 1;

    this.appliedYear = today.getFullYear();

    this.filterForm = this.fb.group({

      month: [this.appliedMonth],

      year: [this.appliedYear]

    });

    this.buildYearOptions();

  }

  // ======================================
  // LOCAL DATE
  // ======================================

  private getTodayDate(): string {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');

    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  // ======================================
  // LOAD EXPENSES FROM FIRESTORE
  // ======================================

  loadExpenses(): void {

    if (!this.userId) {

      this.expenseEntries = [];

      this.groupedExpenses = [];

      this.loading = false;

      this.cdr.detectChanges();

      return;

    }

    this.loading = true;

    this.expensesSubscription?.unsubscribe();

    const expensesRef = collection(
      this.firestore,
      'expenses'
    );

    const expensesQuery = query(
      expensesRef,
      where('userId', '==', this.userId)
    );

    this.expensesSubscription = collectionData(
      expensesQuery,
      { idField: 'id' }
    ).subscribe({

      next: (response: any[]) => {

        console.log('Firestore Expenses:', response);

        this.zone.run(() => {

          this.expenseEntries = (response || []).map(
            (item: any) => ({

              id: item.id,

              userId: item.userId,

              name: item.name || '',

              amount: Number(item.amount) || 0,

              date: item.date || '',

              createdAt: item.createdAt || null,

              updatedAt: item.updatedAt || null

            } as ExpenseEntry)

          );

          // Newest first (descending)
          this.expenseEntries.sort((a, b) => {

            return String(b.date).localeCompare(
              String(a.date)
            );

          });

          // Rebuild year list + apply current month filter
          this.buildYearOptions();

          this.computeGroupedExpenses();

          this.loading = false;

          this.cdr.detectChanges();

        });

      },

      error: error => {

        console.error('Error loading expenses:', error);

        this.zone.run(() => {

          this.expenseEntries = [];

          this.groupedExpenses = [];

          this.loading = false;

          this.cdr.detectChanges();

          Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Unable to load expense records.'
          });

        });

      }

    });

  }

  // ======================================
  // FILTER HELPERS
  // ======================================

  getMonthName(month: number): string {

    return this.months[month - 1] || '';

  }

  /**
   * Safely extract year + month from a record's date.
   * Handles "YYYY-MM-DD" strings and Firestore Timestamps
   * without timezone shifting.
   */
  private getItemYearMonth(item: any): { year: number; month: number } | null {

    const date = item?.date;

    if (date && typeof date.toDate === 'function') {

      const parsed = date.toDate();

      return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1
      };

    }

    if (typeof date === 'string' && date) {

      const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);

      if (match) {

        return {
          year: Number(match[1]),
          month: Number(match[2])
        };

      }

      const parsed = new Date(date);

      if (!Number.isNaN(parsed.getTime())) {

        return {
          year: parsed.getFullYear(),
          month: parsed.getMonth() + 1
        };

      }

    }

    return null;

  }

  // ======================================
  // FORMAT DATE FOR DISPLAY
  // ======================================

  private formatDisplayDate(dateStr: string): string {

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {

      const year = Number(match[1]);

      const month = Number(match[2]);

      const day = Number(match[3]);

      const d = new Date(year, month - 1, day);

      return d.toLocaleDateString('en-US', {

        month: 'short',

        day: 'numeric',

        year: 'numeric'

      });

    }

    return dateStr;

  }

  // ======================================
  // APPLY FILTER (SEARCH BUTTON)
  // ======================================

  applyFilter(): void {

    const { month, year } = this.filterForm.value;

    this.appliedMonth = Number(month);

    this.appliedYear = Number(year);

    this.computeGroupedExpenses();

    this.cdr.detectChanges();

  }

  // ======================================
  // GROUP VISIBLE RECORDS BY DATE
  // ======================================

  private computeGroupedExpenses(): void {

    // 1. Filter to selected month + year
    const filtered = this.expenseEntries.filter(item => {

      const ym = this.getItemYearMonth(item);

      return !!ym &&
        ym.year === this.appliedYear &&
        ym.month === this.appliedMonth;

    });

    // 2. Descending sort (newest date first)
    filtered.sort((a, b) => {

      return String(b.date).localeCompare(String(a.date));

    });

    // 3. Group by date string
    const map = new Map<string, ExpenseGroup>();

    filtered.forEach(item => {

      const key = item.date || '';

      if (!map.has(key)) {

        map.set(key, {

          date: key,

          displayDate: this.formatDisplayDate(key),

          total: 0,

          items: []

        });

      }

      const group = map.get(key)!;

      group.items.push(item);

      group.total += Number(item.amount) || 0;

    });

    this.groupedExpenses = Array.from(map.values());

  }

  // ======================================
  // BUILD YEAR DROPDOWN OPTIONS
  // ======================================

  private buildYearOptions(): void {

    const currentYear = new Date().getFullYear();

    const years = new Set<number>();

    // Always offer the last 5 years
    for (let year = currentYear; year >= currentYear - 4; year--) {

      years.add(year);

    }

    // Plus every year that actually has records
    this.expenseEntries.forEach(item => {

      const ym = this.getItemYearMonth(item);

      if (ym) {

        years.add(ym.year);

      }

    });

    // Keep the applied year selectable
    years.add(this.appliedYear);

    this.yearOptions = Array.from(years).sort((a, b) => b - a);

  }

  // ======================================
  // TOGGLE FORM
  // ======================================

  toggleForm(): void {

    if (this.showForm) {

      this.cancelForm();

    } else {

      this.openForm();

    }

  }

  // ======================================
  // OPEN ADD FORM
  // ======================================

  openForm(): void {

    this.editingId = null;

    this.resetForm();

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // EDIT EXPENSE
  // ======================================

  editExpense(item: ExpenseEntry): void {

    if (!item.id) {

      Swal.fire(
        'Error',
        'Expense record ID not found.',
        'error'
      );

      return;

    }

    this.editingId = item.id;

    this.expenseForm.patchValue({

      name: item.name,

      amount: item.amount,

      date: item.date

    });

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // ADD OR UPDATE EXPENSE
  // ======================================

  async saveExpense(): Promise<void> {

    if (this.saving) return;

    if (this.expenseForm.invalid) {

      this.expenseForm.markAllAsTouched();

      Swal.fire(
        'Required Fields',
        'Please complete all expense fields.',
        'warning'
      );

      return;

    }

    if (!this.userId) {

      Swal.fire(
        'Authentication Error',
        'Please login again.',
        'error'
      );

      return;

    }

    const formValue = this.expenseForm.getRawValue();

    const name = String(formValue.name || '').trim();

    const amount = Number(formValue.amount);

    if (!name) {

      Swal.fire(
        'Invalid Expense',
        'Please enter the expense name.',
        'warning'
      );

      return;

    }

    if (!Number.isFinite(amount) || amount < 0) {

      Swal.fire(
        'Invalid Amount',
        'Please enter a valid expense amount.',
        'warning'
      );

      return;

    }

    const expenseData = {

      userId: this.userId,

      name,

      amount,

      date: formValue.date

    };

    this.saving = true;

    try {

      if (this.editingId) {

        // UPDATE EXISTING EXPENSE
        const expenseRef = doc(
          this.firestore,
          'expenses',
          this.editingId
        );

        await updateDoc(expenseRef, {

          ...expenseData,

          updatedAt: serverTimestamp()

        });

        this.cancelForm();

        await Swal.fire({

          icon: 'success',

          title: 'Updated Successfully!',

          text: 'Expense record updated successfully.',

          timer: 1800,

          showConfirmButton: false

        });

      } else {

        // ADD NEW EXPENSE
        const expensesRef = collection(
          this.firestore,
          'expenses'
        );

        await addDoc(expensesRef, {

          ...expenseData,

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp()

        });

        this.cancelForm();

        await Swal.fire({

          icon: 'success',

          title: 'Saved Successfully!',

          text: 'Expense recorded successfully.',

          timer: 1800,

          showConfirmButton: false

        });

      }

      // Sync filter to the saved record's month so it's visible
      const savedYM = this.getItemYearMonth({ date: expenseData.date });

      if (savedYM) {

        this.appliedMonth = savedYM.month;

        this.appliedYear = savedYM.year;

        this.filterForm.patchValue({

          month: savedYM.month,

          year: savedYM.year

        });

      }

      // collectionData auto-refreshes; recompute grouping
      this.computeGroupedExpenses();

    } catch (error: any) {

      console.error('Save expense error:', error);

      Swal.fire({

        icon: 'error',

        title: 'Operation Failed',

        text: error?.message || 'Unable to save expense.'

      });

    } finally {

      this.saving = false;

      this.cdr.detectChanges();

    }

  }

  // ======================================
  // DELETE EXPENSE
  // ======================================

  async deleteExpense(id: string): Promise<void> {

    if (!id) {

      Swal.fire(
        'Error',
        'Expense record ID not found.',
        'error'
      );

      return;

    }

    const selectedExpense = this.expenseEntries.find(
      item => item.id === id
    );

    if (!selectedExpense) return;

    // Confirm before deleting
    const result = await Swal.fire({

      title: 'Delete Expense?',

      text: `Are you sure you want to delete "${selectedExpense.name}"?`,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Yes, Delete',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#d9534f'

    });

    if (!result.isConfirmed) return;

    try {

      const expenseRef = doc(
        this.firestore,
        'expenses',
        id
      );

      await deleteDoc(expenseRef);

      await Swal.fire({

        icon: 'success',

        title: 'Deleted Successfully!',

        text: 'Expense record deleted successfully.',

        timer: 1800,

        showConfirmButton: false

      });

      // collectionData auto-refreshes; recompute grouping
      this.computeGroupedExpenses();

    } catch (error: any) {

      console.error('Delete expense error:', error);

      Swal.fire({

        icon: 'error',

        title: 'Delete Failed',

        text: error?.message || 'Unable to delete expense.'

      });

    }

  }

  // ======================================
  // CANCEL FORM
  // ======================================

  cancelForm(): void {

    this.resetForm();

    this.showForm = false;

    this.cdr.detectChanges();

  }

  // ======================================
  // RESET FORM
  // ======================================

  private resetForm(): void {

    this.editingId = null;

    this.expenseForm.reset({

      name: '',

      amount: '',

      date: this.getTodayDate()

    });

  }

  // ======================================
  // DESTROY SUBSCRIPTIONS
  // ======================================

  ngOnDestroy(): void {

    this.authSubscription?.unsubscribe();

    this.expensesSubscription?.unsubscribe();

  }

}