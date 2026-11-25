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
  FormArray,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';

import { DataService } from '../../services/data.service';
import {
  Stock,
  Flock,
  FlockProduction
} from '../../models/model';

import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon>
      </a>
      Egg Production
    </div>

    <div class="page-container">

      <div class="action-bar" *ngIf="!showForm">
        <button class="btn-add" (click)="openForm()">
          +  Egg Production
        </button>
      </div>

      <form
        *ngIf="showForm"
        [formGroup]="stockForm"
        (ngSubmit)="saveStock()">

        <div class="form-title">
          {{ editingId ? 'Edit Egg Production' : 'Add Egg Production' }}
        </div>

        <!-- FLOCKS LOADING -->
        <div *ngIf="isLoadingFlocks" class="empty-state">
          <ion-icon name="sync-outline"></ion-icon>
          <p>Loading flocks...</p>
        </div>

        <!-- DYNAMIC FLOCKS -->
        <div
          *ngIf="!isLoadingFlocks && availableFlocks.length > 0"
          formArrayName="flocks">

          <div
            *ngFor="let flockGroup of flocksArray.controls; let i = index"
            [formGroupName]="i">

            <div class="section-header">
              {{ flockGroup.get('name')?.value }}
            </div>

            <div class="input-row">

              <div class="input-wrapper">
                <label>Tray(s)</label>

                <input
                  type="number"
                  formControlName="trays"
                  placeholder="Tray(s)"
                  min="0" />
              </div>

              <div class="input-wrapper">
                <label>Egg(s)</label>

                <input
                  type="number"
                  formControlName="eggs"
                  placeholder="Egg(s)"
                  min="0"
                  max="29" />
              </div>

            </div>

          </div>

        </div>

        <!-- NO FLOCKS -->
        <div
          *ngIf="!isLoadingFlocks && availableFlocks.length === 0"
          class="empty-state">

          <ion-icon name="alert-circle-outline"></ion-icon>

          <p>No flocks found in Flock Management.</p>

          <p>Please add a flock in Flock Management first.</p>

        </div>

        <!-- GENERAL -->
        <div class="section-header">General</div>

        <div class="input-row">

          <div class="input-wrapper">

            <label>Broken Eggs</label>

            <input
              type="number"
              formControlName="brokenEggs"
              placeholder="Broken egg(s)"
              min="0"
              [class.invalid]="
                stockForm.get('brokenEggs')?.invalid &&
                stockForm.get('brokenEggs')?.touched
              " />

            <div
              class="error-text"
              *ngIf="
                stockForm.get('brokenEggs')?.invalid &&
                stockForm.get('brokenEggs')?.touched
              ">
              This field is required
            </div>

          </div>

          <div class="input-wrapper">

            <label>Date</label>

            <input
              type="date"
              formControlName="date" />

          </div>

        </div>

        <button
          type="submit"
          class="btn-save"
          [disabled]="
            isSaving ||
            isLoadingFlocks ||
            availableFlocks.length === 0
          ">

          {{
            isSaving
              ? 'Please wait...'
              : editingId
                ? 'Update Record'
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

      <!-- PRODUCTION RECORDS -->
      <div *ngIf="!showForm" class="list-view">

        <div class="list-header">
          <span>Production Records</span>

          <span class="month-selector">
            - [ {{ getMonthName(appliedMonth) }} {{ appliedYear }} ]
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
            [disabled]="isLoading"
            (click)="applyFilter()">

            <ion-icon name="search-outline"></ion-icon>

            Search

          </button>

        </div>

        <!-- LOADING -->
        <div *ngIf="isLoading" class="empty-state">
          <ion-icon name="sync-outline"></ion-icon>
          <p>Loading records...</p>
        </div>

        <!-- RECORD CARDS -->
        <div
          class="list-card"
          *ngFor="let item of filteredStockEntries">

          <div class="list-row">

            <span class="label">
              Total Trays :
              <strong>{{ item.trays }}</strong>
            </span>

            <span class="badge">
              {{ item.date }}
            </span>

          </div>

          <div class="list-row">

            <span class="label">
              Total Eggs :
              <strong>{{ item.eggs }}</strong>
            </span>

            <div class="item-actions">

              <ion-icon
                name="pencil"
                class="edit-icon"
                title="Edit"
                (click)="editStock(item)">
              </ion-icon>

              <ion-icon
                name="trash-outline"
                class="delete-icon"
                title="Delete"
                (click)="deleteStock(item.id!)">
              </ion-icon>

            </div>

          </div>

          <div class="list-row">

            <span class="label">
              Broken Eggs :
              <strong>{{ item.brokenEggs }}</strong>
            </span>

          </div>

          <!-- INDIVIDUAL FLOCK PRODUCTION -->
          <div
            *ngIf="item.flocks?.length"
            class="flock-production-details">

            <div class="section-header">
              Production By Flock
            </div>

            <div
              *ngFor="let production of item.flocks"
              class="list-row">

              <span class="label">
                {{ production.name }}
              </span>

              <span class="label">
                <strong>{{ production.trays }}</strong> Trays /
                <strong>{{ production.eggs }}</strong> Eggs
              </span>

            </div>

          </div>

        </div>

        <!-- EMPTY STATE -->
        <div
          *ngIf="!isLoading && !loadError && filteredStockEntries.length === 0"
          class="empty-state">

          <ion-icon name="file-tray-outline"></ion-icon>

          <p *ngIf="stockEntries.length === 0">
            No production records found.
          </p>

          <p *ngIf="stockEntries.length > 0">
            No production records found for
            {{ getMonthName(appliedMonth) }} {{ appliedYear }}.
          </p>

        </div>

        <!-- ERROR STATE -->
        <div
          *ngIf="!isLoading && loadError"
          class="empty-state">

          <ion-icon name="alert-circle-outline"></ion-icon>

          <p>Unable to load production records.</p>

          <button
            class="btn-add"
            (click)="loadStocks()">
            Try Again
          </button>

        </div>

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
    }

    .form-title {
      padding: 10px 15px;
      font-size: 16px;
      font-weight: bold;
      color: #555;
    }

    .section-header {
      background-color: #e0e0e0;
      padding: 10px 15px;
      color: #555;
      font-weight: bold;
      margin-top: 10px;
      font-size: 14px;
    }

    .input-row {
      display: flex;
      gap: 15px;
      padding: 10px 15px;
      background-color: #f4f4f4;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .input-wrapper label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .input-row input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
      outline: none;
    }

    .input-row input.invalid {
      border: 1px solid #d9534f;
    }

    .error-text {
      color: #d9534f;
      font-size: 11px;
      margin-top: 4px;
      font-weight: bold;
    }

    .btn-save {
      display: block;
      width: calc(100% - 30px);
      margin: 20px 15px;
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
      margin: -10px 15px 15px;
      padding: 12px;
      background: white;
      color: #666;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .list-view {
      padding: 0 15px;
    }

    .list-header {
      font-size: 14px;
      color: #555;
      margin-bottom: 15px;
    }

    .month-selector {
      font-weight: bold;
    }

    /* ===== MONTH / YEAR FILTER ===== */

    .filter-bar {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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

    .list-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px 15px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      gap: 10px;
    }

    .label {
      color: #555;
      font-size: 14px;
    }

    .badge {
      background-color: #2ecc71;
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .edit-icon {
      color: #888;
      font-size: 18px;
      cursor: pointer;
    }

    .delete-icon {
      color: #d9534f;
      font-size: 18px;
      cursor: pointer;
    }

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

    .flock-production-details {
      border-top: 1px solid #eee;
      margin-top: 8px;
      padding-top: 5px;
    }

    .flock-production-details .section-header {
      margin-top: 5px;
      padding: 8px;
    }

  `]

})

export class StocksComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private auth = inject(Auth);

  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  private authSubscription?: Subscription;
  private stockSubscription?: Subscription;
  private flockSubscription?: Subscription;

  stockForm!: FormGroup;
  filterForm!: FormGroup;

  showForm = false;
  editingId: string | null = null;
  userId = '';

  stockEntries: Stock[] = [];

  // Records currently displayed (filtered by month + year)
  filteredStockEntries: Stock[] = [];

  availableFlocks: Flock[] = [];

  isLoading = true;
  isLoadingFlocks = true;
  isSaving = false;
  loadError = false;

  // ======================================
  // MONTH / YEAR FILTER STATE
  // ======================================

  readonly months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  yearOptions: number[] = [];

  // The filter that is actually APPLIED (only changes on Search)
  appliedMonth: number = new Date().getMonth() + 1;
  appliedYear: number = new Date().getFullYear();

  // ======================================
  // INITIALIZE
  // ======================================

  ngOnInit(): void {

    this.initForm();
    this.initFilterForm();

    this.authSubscription = authState(this.auth).subscribe({

      next: (user) => {

        this.zone.run(() => {

          if (user) {

            this.userId = user.uid;

            this.loadFlocks();
            this.loadStocks();

          } else {

            this.userId = '';

            this.stockEntries = [];
            this.filteredStockEntries = [];
            this.availableFlocks = [];

            this.isLoading = false;
            this.isLoadingFlocks = false;

            this.stockSubscription?.unsubscribe();
            this.flockSubscription?.unsubscribe();

            this.cdr.detectChanges();

          }

        });

      },

      error: (error) => {

        console.error('Authentication error:', error);

        this.zone.run(() => {

          this.isLoading = false;
          this.isLoadingFlocks = false;
          this.loadError = true;

          this.cdr.detectChanges();

        });

      }

    });

  }

  // ======================================
  // INITIALIZE FORM
  // ======================================

  initForm(): void {

    this.stockForm = this.fb.group({

      flocks: this.fb.array([]),

      brokenEggs: ['', Validators.required],

      date: [this.getTodayDate(), Validators.required]

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

  get flocksArray(): FormArray {

    return this.stockForm.get('flocks') as FormArray;

  }

  // ======================================
  // CREATE FLOCK FORM GROUP
  // ======================================

  private createFlockGroup(
    flock: Flock,
    saved?: FlockProduction
  ): FormGroup {

    return this.fb.group({

      flockId: [flock.id || ''],

      name: [flock.name],

      trays: [
        saved?.trays ?? '',
        [Validators.min(0)]
      ],

      eggs: [
        saved?.eggs ?? '',
        [Validators.min(0), Validators.max(29)]
      ]

    });

  }

  // ======================================
  // BUILD FORM FROM REGISTERED FLOCKS
  // ======================================

  private buildFlockForm(
    savedProduction: FlockProduction[] = []
  ): void {

    const formArray = this.flocksArray;

    while (formArray.length > 0) {
      formArray.removeAt(0);
    }

    this.availableFlocks.forEach((flock) => {

      const saved = savedProduction.find(
        production => production.flockId === flock.id
      );

      formArray.push(
        this.createFlockGroup(flock, saved)
      );

    });

  }

  // ======================================
  // LOAD FLOCKS
  // ======================================

  loadFlocks(): void {

    if (!this.userId) {

      this.availableFlocks = [];
      this.isLoadingFlocks = false;

      return;

    }

    this.isLoadingFlocks = true;

    this.flockSubscription?.unsubscribe();

    this.flockSubscription =
      this.dataService.getFlocks(this.userId).subscribe({

        next: (flocks: Flock[]) => {

          this.zone.run(() => {

            this.availableFlocks = (flocks || []).filter(
              flock => !!flock.id
            );

            this.isLoadingFlocks = false;

            if (this.showForm && !this.editingId) {
              this.buildFlockForm();
            }

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Error loading flocks:', error);

          this.zone.run(() => {

            this.availableFlocks = [];
            this.isLoadingFlocks = false;

            this.cdr.detectChanges();

            Swal.fire({
              icon: 'error',
              title: 'Flock Loading Failed',
              text: 'Unable to load flocks from Flock Management.'
            });

          });

        }

      });

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
  // LOAD STOCKS
  // ======================================

  loadStocks(): void {

    if (!this.userId) {

      this.stockEntries = [];
      this.filteredStockEntries = [];
      this.isLoading = false;

      this.cdr.detectChanges();

      return;

    }

    this.isLoading = true;
    this.loadError = false;

    this.stockSubscription?.unsubscribe();

    this.stockSubscription =
      this.dataService.getStocks(this.userId).subscribe({

        next: (response: Stock[]) => {

          this.zone.run(() => {

            this.stockEntries = (response || []).map((item: any) => ({

              ...item,

              id: item.id || '',

              userId: item.userId || this.userId,

              trays: Number(item.trays) || 0,

              eggs: Number(item.eggs) || 0,

              brokenEggs: Number(item.brokenEggs) || 0,

              date: item.date || '',

              flocks: Array.isArray(item.flocks)
                ? item.flocks.map((production: any) => ({
                    flockId: production.flockId || '',
                    name: production.name || 'Unknown Flock',
                    trays: Number(production.trays) || 0,
                    eggs: Number(production.eggs) || 0
                  }))
                : []

            } as Stock));

            this.stockEntries = this.stockEntries.filter(
              item => !!item.id
            );

            // Newest first (descending)
            this.stockEntries.sort((a: any, b: any) => {

              return this.getDateValue(b) -
                     this.getDateValue(a);

            });

            this.isLoading = false;
            this.loadError = false;

            // Rebuild year list and re-apply the current filter
            this.buildYearOptions();
            this.computeFilteredEntries();

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Firebase stock loading error:', error);

          this.zone.run(() => {

            this.stockEntries = [];
            this.filteredStockEntries = [];

            this.isLoading = false;
            this.loadError = true;

            this.cdr.detectChanges();

          });

        }

      });

  }

  // ======================================
  // DATE SORTING
  // ======================================

  private getDateValue(item: any): number {

    const date = item.date;

    if (date && typeof date.toDate === 'function') {
      return date.toDate().getTime();
    }

    if (typeof date === 'string' && date) {

      const parsedDate = new Date(date).getTime();

      if (!Number.isNaN(parsedDate)) {
        return parsedDate;
      }

    }

    const createdAt = item.createdAt;

    if (createdAt && typeof createdAt.toDate === 'function') {
      return createdAt.toDate().getTime();
    }

    if (createdAt?.seconds) {
      return createdAt.seconds * 1000;
    }

    return 0;

  }

  // ======================================
  // FILTER HELPERS
  // ======================================

  getMonthName(month: number): string {

    return this.months[month - 1] || '';

  }

  /**
   * Safely extracts year + month from a record's date.
   * Handles "YYYY-MM-DD" strings (parsed manually to avoid
   * timezone shifting) and Firestore Timestamps.
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
  // APPLY FILTER (SEARCH BUTTON)
  // ======================================

  applyFilter(): void {

    const { month, year } = this.filterForm.value;

    this.appliedMonth = Number(month);
    this.appliedYear = Number(year);

    this.computeFilteredEntries();

    this.cdr.detectChanges();

  }

  // ======================================
  // COMPUTE VISIBLE RECORDS
  // ======================================

  private computeFilteredEntries(): void {

    this.filteredStockEntries = this.stockEntries
      .filter(item => {

        const ym = this.getItemYearMonth(item);

        return !!ym &&
          ym.year === this.appliedYear &&
          ym.month === this.appliedMonth;

      })
      .sort((a: any, b: any) => {

        // Descending (newest first)
        return this.getDateValue(b) -
               this.getDateValue(a);

      });

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

    // Plus any year that actually has records
    this.stockEntries.forEach(item => {

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
  // OPEN FORM
  // ======================================

  openForm(): void {

    if (this.availableFlocks.length === 0) {

      Swal.fire({
        icon: 'info',
        title: 'No Flocks Available',
        text: 'Please add a flock in Flock Management before recording egg production.'
      });

      return;

    }

    this.editingId = null;

    this.resetForm();

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // EDIT STOCK
  // ======================================

  editStock(item: Stock): void {

    if (!item.id) {

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Record ID not found.'
      });

      return;

    }

    if (this.availableFlocks.length === 0) {

      Swal.fire({
        icon: 'warning',
        title: 'No Flocks Available',
        text: 'There are no registered flocks to edit this production record.'
      });

      return;

    }

    this.editingId = item.id;

    const savedProduction = item.flocks || [];

    this.buildFlockForm(savedProduction);

    // Old records have no individual flock breakdown.
    // Put their historical totals into the first available flock.
    if (savedProduction.length === 0 && this.flocksArray.length > 0) {

      this.flocksArray.at(0).patchValue({

        trays: Number(item.trays) || 0,

        eggs: Number(item.eggs) || 0

      });

    }

    this.stockForm.patchValue({

      brokenEggs: Number(item.brokenEggs) || 0,

      date: item.date || this.getTodayDate()

    });

    this.showForm = true;

    this.cdr.detectChanges();

  }

  // ======================================
  // SAVE STOCK
  // ======================================

  async saveStock(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    if (this.isLoadingFlocks) {

      Swal.fire({
        icon: 'info',
        title: 'Please Wait',
        text: 'Flocks are still loading.'
      });

      return;

    }

    if (this.availableFlocks.length === 0) {

      Swal.fire({
        icon: 'warning',
        title: 'No Flocks Found',
        text: 'Please add a flock in Flock Management first.'
      });

      return;

    }

    if (this.stockForm.invalid) {

      this.stockForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please fill in all required fields and check your production values.'
      });

      return;

    }

    if (!this.userId) {

      Swal.fire({
        icon: 'error',
        title: 'Authentication Error',
        text: 'Please login again.'
      });

      return;

    }

    const formValue = this.stockForm.value;

    const flockProduction: FlockProduction[] =
      (formValue.flocks || []).map((flock: any) => ({

        flockId: flock.flockId,

        name: flock.name,

        trays: Number(flock.trays) || 0,

        eggs: Number(flock.eggs) || 0

      }));

    const totalTrays = flockProduction.reduce(
      (total, flock) => total + flock.trays,
      0
    );

    const totalEggs = flockProduction.reduce(
      (total, flock) => total + flock.eggs,
      0
    );

    const stockData: Stock = {

      userId: this.userId,

      trays: totalTrays,

      eggs: totalEggs,

      brokenEggs: Number(formValue.brokenEggs) || 0,

      date: formValue.date,

      flocks: flockProduction

    };

    this.isSaving = true;

    try {

      if (this.editingId) {

        await this.dataService.updateStock(
          this.editingId,
          stockData
        );

        await Swal.fire({
          icon: 'success',
          title: 'Updated Successfully!',
          text: 'Production record updated successfully.',
          timer: 1800,
          showConfirmButton: false
        });

      } else {

        await this.dataService.addStock(stockData);

        await Swal.fire({
          icon: 'success',
          title: 'Saved Successfully!',
          text: 'Production record added successfully.',
          timer: 1800,
          showConfirmButton: false
        });

      }

      // Keep the filter in sync with the saved record's month
      // so the user can actually see what they just saved.
      const savedYM = this.getItemYearMonth(stockData);

      if (savedYM) {

        this.appliedMonth = savedYM.month;
        this.appliedYear = savedYM.year;

        this.filterForm.patchValue({
          month: savedYM.month,
          year: savedYM.year
        });

      }

      this.cancelForm();

      this.loadStocks();

    } catch (error: any) {

      console.error('Save stock error:', error);

      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: error?.message || 'Unable to save production record.'
      });

    } finally {

      this.isSaving = false;

      this.cdr.detectChanges();

    }

  }

  // ======================================
  // DELETE STOCK
  // ======================================

  async deleteStock(id: string): Promise<void> {

    if (!id) {

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Record ID not found.'
      });

      return;

    }

    const result = await Swal.fire({

      title: 'Delete Record?',

      text: 'Are you sure you want to delete this production record?',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Yes, Delete',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#d9534f'

    });

    if (!result.isConfirmed) {
      return;
    }

    try {

      await this.dataService.deleteStock(id);

      this.loadStocks();

      Swal.fire({
        icon: 'success',
        title: 'Deleted Successfully!',
        text: 'Production record deleted successfully.',
        timer: 1800,
        showConfirmButton: false
      });

    } catch (error: any) {

      console.error('Delete stock error:', error);

      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error?.message || 'Unable to delete production record.'
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

    this.buildFlockForm();

    this.stockForm.patchValue({

      brokenEggs: '',

      date: this.getTodayDate()

    });

  }

  // ======================================
  // DESTROY SUBSCRIPTIONS
  // ======================================

  ngOnDestroy(): void {

    this.authSubscription?.unsubscribe();

    this.stockSubscription?.unsubscribe();

    this.flockSubscription?.unsubscribe();

  }

}