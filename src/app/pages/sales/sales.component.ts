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
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Sale } from '../../models/model';

import Swal from 'sweetalert2';

interface SaleGroup {
  date: string;
  displayDate: string;
  totalTrays: number;
  totalAmount: number;
  totalPaid: number;
  totalOwe: number;
  items: Sale[];
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon>
      </a>
      Sales
    </div>

    <div class="page-container">

      <!-- ACTION BAR -->
      <div class="action-bar" *ngIf="!showForm">
        <button type="button" class="btn-add" (click)="openForm()">
          <ion-icon name="add-outline"></ion-icon> Add Sale
        </button>
      </div>

      <!-- FORM VIEW -->
      <form *ngIf="showForm"
            [formGroup]="saleForm"
            (ngSubmit)="saveSale()">

        <div class="section-header">Sales Info</div>

        <div class="input-row">
          <div class="input-wrapper">
            <label>Number of Tray(s)</label>
            <input type="number"
                   formControlName="trays"
                   placeholder="Number of Tray(s)"
                   min="0" />
          </div>

          <div class="input-wrapper">
            <label>Price per Tray</label>
            <input type="number"
                   formControlName="unitPrice"
                   placeholder="Price per Tray"
                   min="0" />
          </div>
        </div>

        <div class="section-header">Customer Info</div>

        <div class="input-row">
          <div class="input-wrapper">
            <label>Customer Name</label>
            <input type="text"
                   formControlName="customerName"
                   placeholder="Customer Name" />
          </div>
        </div>

        <div class="input-row">
          <div class="input-wrapper">
            <label>Mobile number</label>
            <input type="tel"
                   formControlName="mobile"
                   placeholder="Mobile number" />
          </div>
        </div>

        <div class="input-row single-col">
          <div class="input-wrapper">
            <label>Date</label>
            <input type="date" formControlName="saleDate" />
          </div>
        </div>

        <!-- PAYMENT INFO -->
        <div class="section-header">Payment Info</div>

        <div class="input-row single-col">
          <div class="input-wrapper">
            <label>Payment Type</label>
            <select formControlName="paymentType">
              <option value="Full">Full Payment</option>
              <option value="Partial">Partial Payment</option>
            </select>
          </div>
        </div>

        <div class="input-row single-col"
             *ngIf="saleForm.get('paymentType')?.value === 'Partial'">
          <div class="input-wrapper">
            <label>Amount Paid</label>
            <input type="number"
                   formControlName="amountPaid"
                   placeholder="Amount paid"
                   min="0"
                   [max]="formTotalAmount" />
          </div>
        </div>

        <!-- LIVE PAYMENT PREVIEW -->
        <div class="payment-summary">
          <span>
            Total: <strong>{{ formTotalAmount | number:'1.0-0' }}</strong>
          </span>
          <span>
            Paid: <strong>{{ formAmountPaid | number:'1.0-0' }}</strong>
          </span>
          <span [class.has-balance]="formBalance > 0">
            Owe: <strong>{{ formBalance | number:'1.0-0' }}</strong>
          </span>
        </div>

        <button type="submit" class="btn-save" [disabled]="saving">
          {{ saving ? 'Saving...' : (editingId ? 'Update Sale' : 'Save') }}
        </button>

        <button type="button" class="btn-cancel" (click)="cancelForm()">
          Cancel
        </button>

      </form>

      <!-- LIST VIEW -->
      <div *ngIf="!showForm" class="list-view">

        <div class="list-header">
          Sales Summary -
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
          <p>Loading sales records...</p>
        </div>

        <!-- GROUPED BY DAY -->
        <ng-container *ngIf="!loading">

          <div class="day-group" *ngFor="let group of groupedSales">

            <div class="day-group-header">
              <span class="date-label">
                <ion-icon name="calendar-outline"></ion-icon>
                {{ group.displayDate }}
              </span>

              <span class="day-total">
                Total: {{ group.totalAmount | number:'1.0-0' }}
              </span>
            </div>

            <div class="day-summary-bar">
              <span>
                Trays: <strong>{{ group.totalTrays }}</strong>
              </span>
              <span>
                Paid: <strong>{{ group.totalPaid | number:'1.0-0' }}</strong>
              </span>
              <span>
                Owe: <strong>{{ group.totalOwe | number:'1.0-0' }}</strong>
              </span>
            </div>

            <div class="list-card" *ngFor="let item of group.items">

              <div class="list-row">
                <div class="row-left">
                  <span class="label">
                    Tray Sold : <strong>{{ item.trays }}</strong>
                  </span>
                  <span class="price">@{{ item.unitPrice }}</span>
                </div>

                <span class="badge">{{ item.customerName }}</span>
              </div>

              <div class="list-row">
                <div class="row-left">
                  <span class="label">
                    Paid:
                    <strong>{{ item.amountPaid || 0 | number:'1.0-0' }}</strong>
                  </span>

                  <span class="label">
                    Owe:
                    <strong>{{ item.balance || 0 | number:'1.0-0' }}</strong>
                  </span>
                </div>

                <div class="item-actions">
                  <ion-icon
                    name="pencil"
                    class="edit-icon"
                    title="Edit"
                    (click)="editSale(item)">
                  </ion-icon>

                  <ion-icon
                    name="trash-outline"
                    class="delete-icon"
                    title="Delete"
                    (click)="deleteSale(item.id!)">
                  </ion-icon>
                </div>
              </div>

            </div>

          </div>

          <!-- EMPTY STATE -->
          <div *ngIf="groupedSales.length === 0" class="empty-state">
            <ion-icon name="file-tray-outline"></ion-icon>

            <p *ngIf="saleEntries.length === 0">
              No sales records found.
            </p>

            <p *ngIf="saleEntries.length > 0">
              No sales records found for
              {{ getMonthName(appliedMonth) }} {{ appliedYear }}.
            </p>
          </div>

        </ng-container>

      </div>

    </div>
  `,

  styles: [`
    .page-header { background-color: #6a3de8; color: white; padding: 15px; display: flex; align-items: center; font-weight: bold; font-size: 16px; }
    .back-btn { color: white; margin-right: 15px; text-decoration: none; font-size: 20px; display: flex; align-items: center; }
    .page-container { background-color: #f4f4f4; min-height: 100vh; padding-bottom: 20px; }
    .action-bar { display: flex; justify-content: flex-end; padding: 15px; }
    .btn-add { background-color: #f39c12; color: white; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .section-header { background-color: #e0e0e0; padding: 10px 15px; color: #555; font-weight: 500; margin-top: 10px; }
    .input-row { display: flex; gap: 15px; padding: 10px 15px; background-color: #f4f4f4; }
    .input-row.single-col { padding-top: 0; }
    .input-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .input-wrapper label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .input-row input,
    .input-row select {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
      outline: none;
      font-size: 14px;
    }
    .input-row input.invalid { border: 1px solid #d9534f; }

    /* PAYMENT PREVIEW */
    .payment-summary {
      display: flex;
      justify-content: space-between;
      background: #fff;
      border: 1px solid #ddd;
      margin: 10px 15px 0;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 13px;
      color: #555;
    }
    .payment-summary strong { color: #333; }
    .payment-summary .has-balance strong { color: #d9534f; }

    .btn-save { display: block; width: calc(100% - 30px); margin: 20px 15px 10px; padding: 15px; background-color: #f39c12; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; }
    .btn-cancel { display: block; width: calc(100% - 30px); margin: 0 15px 15px; padding: 12px; background: white; color: #666; border: 1px solid #ccc; border-radius: 4px; }
    .list-view { padding: 0 15px; }
    .list-header { font-size: 14px; color: #555; margin-bottom: 12px; background: white; padding: 10px; border-radius: 4px; }
    .month-selector { font-weight: bold; }

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
    .filter-field { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .filter-field label { font-size: 11px; color: #666; margin-bottom: 4px; }
    .filter-field select { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid #ccc; border-radius: 4px; background: white; outline: none; font-size: 14px; }
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
    .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-search ion-icon { font-size: 16px; }

    /* DAY GROUP */
    .day-group { margin-bottom: 16px; }
    .day-group-header {
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
    .date-label { display: inline-flex; align-items: center; gap: 6px; }
    .date-label ion-icon { font-size: 16px; }
    .day-total { color: #6a3de8; }

    .day-summary-bar {
      display: flex;
      justify-content: space-between;
      background: #fafafa;
      border: 1px solid #ddd;
      border-top: none;
      padding: 6px 12px;
      font-size: 12px;
      color: #666;
    }
    .day-summary-bar strong { color: #333; }

    .list-card {
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0;
      padding: 10px 15px;
      margin-bottom: 0;
      box-shadow: none;
    }
    .list-card:last-child { border-radius: 0 0 4px 4px; }
    .list-card + .list-card { border-top: 1px solid #eee; }

    .list-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; }
    .row-left { display: flex; gap: 15px; align-items: center; }
    .label { color: #555; font-size: 14px; }
    .price { color: #428bca; font-size: 14px; }
    .badge { background-color: #2ecc71; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .item-actions { display: flex; align-items: center; gap: 15px; }
    .edit-icon { color: #555; font-size: 18px; cursor: pointer; }
    .delete-icon { color: #d9534f; font-size: 18px; cursor: pointer; }
    .empty-state { text-align: center; padding: 30px; background: white; color: #888; border-radius: 5px; }
    .empty-state ion-icon { font-size: 35px; }
  `]
})

export class SalesComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private auth = inject(Auth);

  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  private salesSubscription?: Subscription;
  private authSubscription?: Subscription;
  private paymentTypeSub?: Subscription;

  saleForm!: FormGroup;
  filterForm!: FormGroup;

  showForm = false;
  editingId: string | null = null;
  userId = '';

  saleEntries: Sale[] = [];
  groupedSales: SaleGroup[] = [];

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

      next: (user) => {

        this.zone.run(() => {

          this.salesSubscription?.unsubscribe();

          if (!user) {

            this.userId = '';
            this.saleEntries = [];
            this.groupedSales = [];
            this.loading = false;

            this.cdr.detectChanges();

            return;
          }

          this.userId = user.uid;

          console.log('Authenticated User ID:', this.userId);

          this.loadSales();

        });

      },

      error: (error) => {

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

    this.saleForm = this.fb.group({

      trays: ['', [
        Validators.required,
        Validators.min(1)
      ]],

      unitPrice: ['', [
        Validators.required,
        Validators.min(0)
      ]],

      customerName: [''],

      mobile: [''],

      saleDate: [
        this.getTodayDate(),
        Validators.required
      ],

      paymentType: ['Full', Validators.required],

      amountPaid: [{ value: '', disabled: true }]

    });

    // Enable / disable amountPaid when payment type changes
    this.paymentTypeSub = this.saleForm
      .get('paymentType')
      ?.valueChanges
      .subscribe((type: string) => {

        const amountPaidCtrl = this.saleForm.get('amountPaid');

        if (!amountPaidCtrl) return;

        if (type === 'Partial') {

          amountPaidCtrl.enable({ emitEvent: false });

          amountPaidCtrl.setValidators([
            Validators.required,
            Validators.min(0)
          ]);

        } else {

          amountPaidCtrl.setValue('', { emitEvent: false });

          amountPaidCtrl.disable({ emitEvent: false });

          amountPaidCtrl.clearValidators();

        }

        amountPaidCtrl.updateValueAndValidity({ emitEvent: false });

      });

  }

  // ======================================
  // INITIALIZE FILTER FORM
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
  // FORM PREVIEW GETTERS
  // ======================================

  get formTotalAmount(): number {

    const v = this.saleForm?.getRawValue();

    return (Number(v?.trays) || 0) * (Number(v?.unitPrice) || 0);

  }

  get formAmountPaid(): number {

    const v = this.saleForm?.getRawValue();

    const total = this.formTotalAmount;

    if (v?.paymentType === 'Partial') {

      const paid = Number(v?.amountPaid) || 0;

      return Math.min(Math.max(paid, 0), total);

    }

    return total;

  }

  get formBalance(): number {

    return Math.max(this.formTotalAmount - this.formAmountPaid, 0);

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
  // LOAD SALES FROM FIRESTORE
  // ======================================

  loadSales(): void {

    if (!this.userId) {

      this.saleEntries = [];
      this.groupedSales = [];
      this.loading = false;

      this.cdr.detectChanges();

      return;

    }

    this.loading = true;

    this.salesSubscription?.unsubscribe();

    console.log('Loading sales for user:', this.userId);

    this.salesSubscription = this.dataService
      .getSales(this.userId)
      .subscribe({

        next: (response: any) => {

          console.log('Raw Firestore sales response:', response);

          this.zone.run(() => {

            let records: any[] = [];

            if (Array.isArray(response)) {
              records = response;
            } else if (response?.docs && Array.isArray(response.docs)) {
              records = response.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
              }));
            } else if (Array.isArray(response?.data)) {
              records = response.data;
            }

            this.saleEntries = records.map((item: any) => {

              let sale: any = item;

              if (typeof item?.data === 'function') {
                sale = item.data();
              } else if (item?.data && typeof item.data === 'object') {
                sale = item.data;
              }

              return {

                ...sale,

                id: item.id || sale.id || '',
                userId: sale.userId || this.userId,
                trays: Number(sale.trays) || 0,
                unitPrice: Number(sale.unitPrice) || 0,
                customerName: sale.customerName || 'Unknown',
                saleDate: sale.saleDate || '',
                totalAmount: Number(sale.totalAmount) || 0,
                amountPaid: Number(sale.amountPaid) || 0,
                balance: Number(sale.balance) || 0

              } as Sale;

            }).filter((item: Sale) => !!item.id);

            this.saleEntries.sort((a: any, b: any) => {

              return this.getSaleDateValue(b) -
                     this.getSaleDateValue(a);

            });

            this.buildYearOptions();
            this.computeGroupedSales();

            this.loading = false;
            this.cdr.detectChanges();

          });

        },

        error: (error: any) => {

          console.error('Firestore sales loading error:', error);

          this.zone.run(() => {

            this.saleEntries = [];
            this.groupedSales = [];
            this.loading = false;

            this.cdr.detectChanges();

          });

        }

      });

  }

  // ======================================
  // SALE DATE SORTING
  // ======================================

  private getSaleDateValue(item: any): number {

    const date = item.saleDate;

    if (date && typeof date.toDate === 'function') {
      return date.toDate().getTime();
    }

    if (date) {

      const timestamp = new Date(date).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }

    }

    if (item.createdAt?.toDate) {
      return item.createdAt.toDate().getTime();
    }

    if (item.createdAt?.seconds) {
      return item.createdAt.seconds * 1000;
    }

    return 0;

  }

  // ======================================
  // FILTER HELPERS
  // ======================================

  getMonthName(month: number): string {

    return this.months[month - 1] || '';

  }

  private getItemYearMonth(item: any): { year: number; month: number } | null {

    const date = item?.saleDate;

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

  private formatDisplayDate(dateStr: string): string {

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const d = new Date(year, month - 1, day);

      return d.toLocaleDateString('en-US', {
        weekday: 'short',
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

    this.computeGroupedSales();

    this.cdr.detectChanges();

  }

  // ======================================
  // GROUP FILTERED SALES BY DAY
  // ======================================

  private computeGroupedSales(): void {

    const filtered = this.saleEntries.filter(item => {

      const ym = this.getItemYearMonth(item);

      return !!ym &&
        ym.year === this.appliedYear &&
        ym.month === this.appliedMonth;

    });

    filtered.sort((a: any, b: any) => {

      return this.getSaleDateValue(b) -
             this.getSaleDateValue(a);

    });

    const map = new Map<string, SaleGroup>();

    filtered.forEach(item => {

      const key = item.saleDate || '';

      if (!map.has(key)) {

        map.set(key, {
          date: key,
          displayDate: this.formatDisplayDate(key),
          totalTrays: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOwe: 0,
          items: []
        });

      }

      const group = map.get(key)!;

      group.items.push(item);
      group.totalTrays += Number(item.trays) || 0;
      group.totalAmount += Number(item.totalAmount) || 0;
      group.totalPaid += Number(item.amountPaid) || 0;
      group.totalOwe += Number(item.balance) || 0;

    });

    this.groupedSales = Array.from(map.values());

  }

  // ======================================
  // BUILD YEAR DROPDOWN OPTIONS
  // ======================================

  private buildYearOptions(): void {

    const currentYear = new Date().getFullYear();

    const years = new Set<number>();

    for (let year = currentYear; year >= currentYear - 4; year--) {
      years.add(year);
    }

    this.saleEntries.forEach(item => {

      const ym = this.getItemYearMonth(item);

      if (ym) {
        years.add(ym.year);
      }

    });

    years.add(this.appliedYear);

    this.yearOptions = Array.from(years).sort((a, b) => b - a);

  }

  // ======================================
  // OPEN FORM
  // ======================================

  openForm(): void {

    this.editingId = null;

    this.resetForm();

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // EDIT SALE
  // ======================================

  editSale(item: Sale): void {

    if (!item.id) {

      Swal.fire('Error', 'Sale record ID not found.', 'error');

      return;

    }

    this.editingId = item.id;

    const total = Number(item.totalAmount) ||
      ((Number(item.trays) || 0) * (Number(item.unitPrice) || 0));

    const paid = Number(item.amountPaid) || 0;

    const isPartial = total > 0 && paid < total;

    // 1) Set payment type first — the subscription will enable/disable
    //    the amountPaid control correctly.
    this.saleForm.get('paymentType')?.setValue(
      isPartial ? 'Partial' : 'Full'
    );

    // 2) Restore the amount paid value for partial sales
    if (isPartial) {

      const amountCtrl = this.saleForm.get('amountPaid');

      if (amountCtrl) {
        amountCtrl.setValue(paid, { emitEvent: false });
      }

    }

    // 3) Patch remaining fields
    this.saleForm.patchValue({

      trays: item.trays,
      unitPrice: item.unitPrice,
      customerName: item.customerName,
      mobile: (item as any).mobile || '',
      saleDate: item.saleDate

    });

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // SAVE OR UPDATE SALE
  // ======================================

  async saveSale(): Promise<void> {

    if (this.saving) return;

    if (this.saleForm.invalid) {

      this.saleForm.markAllAsTouched();

      Swal.fire('Required Fields', 'Please fill in all required fields.', 'warning');

      return;

    }

    if (!this.userId) {

      Swal.fire('Authentication Error', 'Please login again.', 'error');

      return;

    }

    const value = this.saleForm.getRawValue();

    const trays = Number(value.trays) || 0;
    const unitPrice = Number(value.unitPrice) || 0;
    const totalAmount = trays * unitPrice;

    // ====== PAYMENT LOGIC ======
    let amountPaid: number;

    if (value.paymentType === 'Partial') {

      const entered = Number(value.amountPaid);

      if (!Number.isFinite(entered) || entered < 0) {

        Swal.fire(
          'Invalid Amount',
          'Please enter a valid amount paid.',
          'warning'
        );

        return;

      }

      if (entered > totalAmount) {

        Swal.fire(
          'Invalid Amount',
          'Amount paid cannot be greater than the total amount.',
          'warning'
        );

        return;

      }

      amountPaid = entered;

    } else {

      amountPaid = totalAmount;

    }

    const balance = Math.max(totalAmount - amountPaid, 0);

    const saleData: Sale = {

      userId: this.userId,
      trays,
      unitPrice,
      customerName: value.customerName || 'Unknown',
      saleDate: value.saleDate,
      totalAmount,
      amountPaid,
      balance,
      product: 'Eggs',
      quantity: trays * 30,
      paymentMethod: value.paymentType === 'Partial' ? 'Partial' : 'Cash'

    };

    (saleData as any).mobile = value.mobile || '';

    this.saving = true;

    try {

      if (this.editingId) {

        await this.dataService.updateSale(this.editingId, saleData);

        await Swal.fire({
          icon: 'success',
          title: 'Updated Successfully!',
          text: 'Sale record updated successfully.',
          timer: 1600,
          showConfirmButton: false
        });

      } else {

        await this.dataService.addSale(saleData);

        await Swal.fire({
          icon: 'success',
          title: 'Saved Successfully!',
          text: 'Sale record added successfully.',
          timer: 1600,
          showConfirmButton: false
        });

      }

      // Sync filter to the saved record's month so it's visible
      const savedYM = this.getItemYearMonth({ saleDate: value.saleDate });

      if (savedYM) {

        this.appliedMonth = savedYM.month;
        this.appliedYear = savedYM.year;

        this.filterForm.patchValue({
          month: savedYM.month,
          year: savedYM.year
        });

      }

      this.cancelForm();

      this.loadSales();

    } catch (error: any) {

      console.error('Save sale error:', error);

      Swal.fire('Save Failed', error?.message || 'Unable to save sale record.', 'error');

    } finally {

      this.saving = false;
      this.cdr.detectChanges();

    }

  }

  // ======================================
  // DELETE SALE
  // ======================================

  async deleteSale(id: string): Promise<void> {

    if (!id) {

      Swal.fire('Error', 'Sale ID is missing.', 'error');

      return;

    }

    const result = await Swal.fire({

      title: 'Delete Sale?',
      text: 'Are you sure you want to delete this sale?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d9534f'

    });

    if (!result.isConfirmed) return;

    try {

      await this.dataService.deleteSale(id);

      this.loadSales();

      Swal.fire({
        icon: 'success',
        title: 'Deleted Successfully!',
        timer: 1600,
        showConfirmButton: false
      });

    } catch (error: any) {

      console.error('Delete sale error:', error);

      Swal.fire('Delete Failed', error?.message || 'Unable to delete sale record.', 'error');

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

    // Reset payment type first so subscription disables amountPaid
    this.saleForm.get('paymentType')?.setValue('Full');

    this.saleForm.reset({

      trays: '',
      unitPrice: '',
      customerName: '',
      mobile: '',
      saleDate: this.getTodayDate(),
      paymentType: 'Full',
      amountPaid: ''

    });

  }

  // ======================================
  // DESTROY SUBSCRIPTIONS
  // ======================================

  ngOnDestroy(): void {

    this.authSubscription?.unsubscribe();
    this.salesSubscription?.unsubscribe();
    this.paymentTypeSub?.unsubscribe();

  }

}