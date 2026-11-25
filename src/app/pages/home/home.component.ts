
import {
  Component,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  NgIf,
  DecimalPipe
} from '@angular/common';

import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

import {
  Flock,
  Stock,
  UserProfile,
  HealthRecord
} from '../../models/model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIf,
    DecimalPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="dashboard-wrapper">

      <!-- LOADING OVERLAY -->
      <div class="loading-overlay" *ngIf="isNavigating">
        <div class="spinner"></div>
        <p>Inapakia...</p>
      </div>

      <!-- HEADER -->
      <header class="app-header">
        <div class="header-top">

          <div class="logo-container">
            <div class="logo-circle">
              <ion-icon name="egg-outline"></ion-icon>
            </div>

            <div class="logo-text">
              <h1>LAYORA</h1>
              <p>{{ businessName }}</p>
            </div>
          </div>

          <!-- USER PROFILE -->
          <div class="profile-section">

            <div
              class="user-trigger"
              (click)="toggleDropdown()"
            >
              <div class="user-info">
                <span class="user-name">
                  {{ userDisplayName || 'User' }}
                </span>
              </div>

              <ion-icon
                name="person-circle-outline"
                class="profile-icon">
              </ion-icon>

              <ion-icon
                name="chevron-down-outline"
                class="dropdown-arrow">
              </ion-icon>
            </div>

            <div
              class="dropdown-menu"
              *ngIf="isDropdownOpen"
            >
              <a
                routerLink="/my-profile"
                class="dropdown-item"
                (click)="closeDropdown()"
              >
                <ion-icon name="person-outline"></ion-icon>
                Wasifu Wangu
              </a>

              <button
                class="dropdown-item logout-item"
                (click)="logout()"
              >
                <ion-icon name="log-out-outline"></ion-icon>
                Toka (Logout)
              </button>
            </div>

          </div>
        </div>

        <div class="header-curve"></div>
      </header>

      <span class="user-greeting">
        {{ greeting }}
      </span>

      <!-- DASHBOARD STATISTICS -->
      <section class="stats-row">

        <!-- TOTAL BIRDS -->
        <div class="stat-card">
          <div class="stat-icon purple">
            <ion-icon name="egg-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ totalBirdsCount | number }}</h3>
            <p>Total Birds</p>
          </div>
        </div>

        <!-- LAYING HENS -->
        <div class="stat-card">
          <div class="stat-icon orange">
            <ion-icon name="nutrition-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ totalLayingHens | number }}</h3>
            <p>Laying Hens</p>
          </div>
        </div>

        <!-- AVERAGE HDP -->
        <div class="stat-card">
          <div class="stat-icon teal">
            <ion-icon name="analytics-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ averageHDP | number:'1.1-1' }}%</h3>
            <p>Average HDP</p>
          </div>
        </div>

        <!-- HEALTH RATE -->
        <div class="stat-card">
          <div class="stat-icon green">
            <ion-icon name="heart-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ healthRate | number:'1.1-1' }}%</h3>
            <p>Health Rate</p>
          </div>
        </div>

        <!-- SICK BIRDS -->
        <div class="stat-card">
          <div class="stat-icon red">
            <ion-icon name="medkit-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ sickBirds | number }}</h3>
            <p>Sick Birds</p>
          </div>
        </div>

        <!-- DEAD BIRDS -->
        <div class="stat-card">
          <div class="stat-icon dark">
            <ion-icon name="alert-circle-outline"></ion-icon>
          </div>

          <div class="stat-info">
            <h3>{{ deadBirds | number }}</h3>
            <p>Dead Birds</p>
          </div>
        </div>

      </section>

      <!-- DASHBOARD GRID -->
      <section class="dashboard-grid">

        <a
          routerLink="/manage-flock"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="home-outline" class="grid-icon"></ion-icon>
            <span>Flock Management</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/manage-feed"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="leaf-outline" class="grid-icon"></ion-icon>
            <span>Feed Management</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/manage-health"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="medkit-outline" class="grid-icon"></ion-icon>
            <span>Health Records</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/stocks"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="egg-outline" class="grid-icon"></ion-icon>
            <span>Egg Production</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/sales"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="cart-outline" class="grid-icon"></ion-icon>
            <span>Sales</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/expenses"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="wallet-outline" class="grid-icon"></ion-icon>
            <span>Expenses</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a routerLink="/reports" class="grid-card"
        (click)="showLoader()">
          <div class="grid-card-left">
            <ion-icon name="bar-chart-outline" class="grid-icon"></ion-icon>
            <span>Reports</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

        <a
          routerLink="/my-profile"
          class="grid-card"
          (click)="showLoader()"
        >
          <div class="grid-card-left">
            <ion-icon name="settings-outline" class="grid-icon"></ion-icon>
            <span>Settings</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="chevron"></ion-icon>
        </a>

      </section>

      <!-- IMPORTANT INFORMATION -->
      <section class="info-box">

        <div class="info-content">

          <div class="info-icon">
            <ion-icon name="bulb-outline"></ion-icon>
          </div>

          <div class="info-text">

            <h4>Taarifa Muhimu</h4>

            <ng-container
              *ngIf="hasCurrentMonthData || hasPreviousMonthData"
            >

              <p *ngIf="monthlyChange > 0">
                Hongera! Uzalishaji wa mayai umeongezeka kwa
                <strong>
                  {{ monthlyChange | number:'1.1-1' }}%
                </strong>
                mwezi huu ikilinganishwa na mwezi uliopita.
                Jumla ya trays mwezi huu ni
                <strong>{{ traysThisMonth | number:'1.1-1' }}</strong>.
              </p>

              <p *ngIf="monthlyChange < 0">
                Tahadhari! Uzalishaji wa mayai umepungua kwa
                <strong>
                  {{ absoluteMonthlyChange | number:'1.1-1' }}%
                </strong>
                mwezi huu ikilinganishwa na mwezi uliopita.
                Jumla ya trays mwezi huu ni
                <strong>{{ traysThisMonth | number:'1.1-1' }}</strong>.
              </p>

              <p
                *ngIf="
                  monthlyChange === 0 &&
                  hasPreviousMonthData
                "
              >
                Uzalishaji wa mayai umebaki katika kiwango kilekile
                ikilinganishwa na mwezi uliopita.
                Jumla ya trays mwezi huu ni
                <strong>{{ traysThisMonth | number:'1.1-1' }}</strong>.
              </p>

              <p
                *ngIf="
                  !hasPreviousMonthData &&
                  hasCurrentMonthData
                "
              >
                Uzalishaji wa mwezi huu umefikia
                <strong>{{ traysThisMonth | number:'1.1-1' }}</strong>
                trays. Hakuna rekodi za mwezi uliopita za kufanya
                ulinganisho.
              </p>

            </ng-container>

            <p
              *ngIf="
                !hasCurrentMonthData &&
                !hasPreviousMonthData
              "
            >
              Hakuna rekodi za uzalishaji wa mayai kwa mwezi huu
              au mwezi uliopita. Tafadhali sajili Egg Production
              ili kupata takwimu sahihi.
            </p>

          </div>
        </div>

        <button
          class="report-btn"
          routerLink="/stocks"
        >
          <ion-icon name="bar-chart-outline"></ion-icon>
          Tazama Uzalishaji
        </button>

      </section>

    </div>

    <!-- BOTTOM NAVIGATION -->
    <nav class="bottom-nav">

      <a routerLink="/home" routerLinkActive="active">
        <ion-icon name="home-outline"></ion-icon>
        <span>Home</span>
      </a>

      <a routerLink="#">
        <ion-icon name="bar-chart-outline"></ion-icon>
        <span>Ripoti</span>
      </a>

      <a routerLink="/manage-flock">
        <ion-icon name="egg-outline"></ion-icon>
        <span>Flock</span>
      </a>

      <a routerLink="/notifications">
        <ion-icon name="notifications-outline"></ion-icon>
        <span>Arifa</span>
        <small class="notification-badge">0</small>
      </a>

      <a routerLink="/my-profile">
        <ion-icon name="settings-outline"></ion-icon>
        <span>Mipangilio</span>
      </a>

    </nav>
  `,

  styles: [`

    :host {
      display: block;
      min-height: 100vh;
      background: #F7F8FA;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .dashboard-wrapper {
      padding-bottom: 90px;
    }

    /* LOADING */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,.85);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #E0E0E0;
      border-top-color: #4b1d8f;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      margin-bottom: 15px;
    }

    .loading-overlay p {
      color: #4b1d8f;
      font-weight: 700;
      margin: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* HEADER */
    .app-header {
      background: linear-gradient(135deg,#4b1d8f,#6a3bbd);
      color: white;
      padding: 16px 16px 32px;
      border-radius: 0 0 24px 24px;
      position: relative;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 10;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .logo-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: white;
      color: #4b1d8f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .logo-text h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 1px;
    }

    .logo-text p {
      font-size: 10px;
      margin: 0;
      opacity: .9;
    }

    /* PROFILE */
    .profile-section {
      position: relative;
    }

    .user-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      background: rgba(255,255,255,.1);
      padding: 6px 10px;
      border-radius: 20px;
    }

    .user-info {
      display: flex;
      align-items: flex-end;
      margin-right: 4px;
    }

    .user-name {
      font-size: 11px;
      font-weight: 600;
    }

    .profile-icon {
      font-size: 24px;
    }

    .dropdown-arrow {
      font-size: 12px;
    }

    .dropdown-menu {
      position: absolute;
      top: 110%;
      right: 0;
      width: 160px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      overflow: hidden;
      z-index: 100;
      display: flex;
      flex-direction: column;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      text-decoration: none;
      color: #333;
      font-size: 13px;
      font-weight: 500;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: #F0EAFF;
    }

    .dropdown-item ion-icon {
      font-size: 18px;
      color: #7047F5;
    }

    .logout-item {
      color: #D32F2F;
      border-top: 1px solid #eee;
    }

    .logout-item ion-icon {
      color: #D32F2F;
    }

    .user-greeting {
      display: block;
      font-size: 13px;
      color: #555;
      padding: 20px 16px 4px;
    }

   

    /* DASHBOARD LINKS */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 12px;
      padding: 10px 16px;
    }

    .grid-card {
      background: white;
      border-radius: 12px;
      padding: 22px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-decoration: none;
      color: #333;
      border: 1px solid #ddd;
      box-shadow: 0 2px 6px rgba(0,0,0,.04);
      min-width: 0;
    }

    .grid-card-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .grid-icon {
      font-size: 24px;
      color: #7047F5;
      flex-shrink: 0;
    }

    .grid-card span {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.3;
    }

    .chevron {
      font-size: 18px;
      color: #7047F5;
      flex-shrink: 0;
    }

    /* INFORMATION */
    .info-box {
      background: #F3EEFF;
      border-radius: 16px;
      padding: 16px;
      margin: 0 16px 90px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-content {
      display: flex;
      gap: 12px;
    }

    .info-icon {
      color: #7047F5;
      font-size: 24px;
      display: flex;
      align-items: flex-start;
    }

    .info-text h4 {
      margin: 0 0 4px;
      font-size: 14px;
      color: #4A1D82;
      font-weight: 700;
    }

    .info-text p {
      margin: 0;
      font-size: 12px;
      color: #444;
      line-height: 1.5;
    }

    .report-btn {
      align-self: flex-end;
      background: transparent;
      border: 1px solid #7047F5;
      color: #4A1D82;
      padding: 7px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    /* BOTTOM NAVIGATION */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 72px;
      background: white;
      border-top: 1px solid #e5eaf2;
      box-shadow: 0 -3px 12px rgba(0,0,0,.06);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 999;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .bottom-nav a {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      position: relative;
      text-decoration: none;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
    }

    .bottom-nav a ion-icon {
      font-size: 26px;
    }

    .bottom-nav a.active {
      color: #1265e8;
    }

    .bottom-nav a.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      width: 75%;
      height: 3px;
      background: #1265e8;
      border-radius: 5px 5px 0 0;
    }

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 22%;
      background: #e53935;
      color: white;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }



    /* STATISTICS - PROFESSIONAL DESIGN */
/* PROFESSIONAL COMPACT STATS */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  padding: 8px 32px;
}

.stat-card {
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;

  gap: 7px;
  padding: 5px 2px;
  min-width: 0;
  min-height: 48px;
  text-align: left;
}

.stat-icon {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 9px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 16px;
  flex-shrink: 0;
}

.stat-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-info h3 {
  font-size: 15px;
  font-weight: 800;
  margin: 0;
  color: #25213a;
  line-height: 1.1;
}

.stat-info p {
  font-size: 9px;
  font-weight: 600;
  margin: 3px 0 0;
  color: #77738a;
  line-height: 1.2;
}

/* ICON COLORS */
.stat-icon.purple { color:#7047F5; background:#F0EAFF; }
.stat-icon.orange { color:#F5A623; background:#FFF4E5; }
.stat-icon.teal { color:#009688; background:#E0F2F1; }
.stat-icon.green { color:#16A36A; background:#E7F8EF; }
.stat-icon.red { color:#E53935; background:#FFEEEE; }
.stat-icon.dark { color:#596579; background:#EEF1F5; }

/* SMALL DEVICES */
@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px 1px;
    padding: 1px 1px 1px 10px;
  }

  .stat-card {
    gap: 2px;
    padding: 4px 1px;
    min-height: 10px;
  }

  .stat-icon {
    width: 26px;
    height: 26px;
    min-width: 26px;
    font-size: 14px;
    border-radius: 7px;
  }

  .stat-info h3 {
    font-size: 13px;
  }

  .stat-info p {
    font-size: 8px;
    margin-top: 2px;
  }
}
    @media (min-width: 768px) {
      .bottom-nav {
        max-width: 650px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 15px 15px 0 0;
      }
    }

  `]
})

export class HomeComponent implements OnInit, OnDestroy {

  // SERVICES
  authService = inject(AuthService);
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // SUBSCRIPTIONS
  private authSubscription?: Subscription;
  private stockSubscription?: Subscription;
  private flockSubscription?: Subscription;
  private profileSubscription?: Subscription;
  private healthSubscription?: Subscription;

  // USER INFORMATION
  userId = '';
  businessName = 'Loading...';
  userDisplayName = 'User';

  // DASHBOARD DATA
  isDropdownOpen = false;
  isNavigating = false;

  totalBirdsCount = 0;

  flocks: Flock[] = [];
  stockEntries: Stock[] = [];
  healthRecords: HealthRecord[] = [];

  // =====================================
  // INITIALIZATION
  // =====================================

  ngOnInit(): void {

    this.authSubscription =
      this.authService.currentUser$.subscribe({

        next: (user) => {

          this.unsubscribeUserSubscriptions();

          this.ngZone.run(() => {

            this.flocks = [];
            this.stockEntries = [];
            this.healthRecords = [];
            this.totalBirdsCount = 0;

            if (!user) {

              this.userId = '';
              this.businessName = 'My Poultry Farm';
              this.userDisplayName = 'User';

              this.cdr.detectChanges();
              return;
            }

            this.userId = user.uid;

            this.userDisplayName =
              user.displayName?.trim() || 'User';

            this.cdr.detectChanges();

            this.loadBusinessName(user.uid);
            this.loadFlocks();
            this.loadStocks();
            this.loadHealthRecords();

          });

        },

        error: (error) => {

          console.error('Authentication Error:', error);

          this.ngZone.run(() => {
            this.businessName = 'My Poultry Farm';
            this.userDisplayName = 'User';
            this.cdr.detectChanges();
          });

        }

      });

  }

  private unsubscribeUserSubscriptions(): void {

    this.stockSubscription?.unsubscribe();
    this.flockSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();
    this.healthSubscription?.unsubscribe();

  }

  // =====================================
  // GREETING
  // =====================================

  get greeting(): string {

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Habari za asubuhi';
    }

    if (hour >= 12 && hour < 17) {
      return 'Habari za mchana';
    }

    if (hour >= 17 && hour < 21) {
      return 'Habari za jioni';
    }

    return 'Habari za usiku';

  }

  // =====================================
  // LOAD BUSINESS PROFILE
  // =====================================

  loadBusinessName(uid: string): void {

    if (!uid) {
      this.businessName = 'My Poultry Farm';
      return;
    }

    this.profileSubscription?.unsubscribe();

    this.profileSubscription = this.dataService
      .getUserProfile(uid)
      .subscribe({

        next: (profile: UserProfile | null) => {

          this.ngZone.run(() => {

            if (this.userId !== uid) return;

            const name = String(
              profile?.businessName || ''
            ).trim();

            this.businessName =
              name || 'My Poultry Farm';

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Error loading business name:', error);

          this.ngZone.run(() => {

            if (this.userId !== uid) return;

            this.businessName = 'My Poultry Farm';
            this.cdr.detectChanges();

          });

        }

      });

  }

  // =====================================
  // LOAD FLOCKS
  // =====================================

  loadFlocks(): void {

    if (!this.userId) {
      this.flocks = [];
      this.totalBirdsCount = 0;
      return;
    }

    this.flockSubscription?.unsubscribe();

    const currentUid = this.userId;

    this.flockSubscription = this.dataService
      .getFlocks(currentUid)
      .subscribe({

        next: (records: Flock[]) => {

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.flocks = records || [];

            this.totalBirdsCount = this.flocks
              .filter(flock =>
                String(flock.status || '').toLowerCase() !== 'completed'
              )
              .reduce(
                (total, flock) =>
                  total + Math.max(0, Number(flock.birds) || 0),
                0
              );

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Flock Loading Error:', error);

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.flocks = [];
            this.totalBirdsCount = 0;

            this.cdr.detectChanges();

          });

        }

      });

  }

  // =====================================
  // LOAD STOCKS
  // =====================================

  loadStocks(): void {

    if (!this.userId) {
      this.stockEntries = [];
      return;
    }

    this.stockSubscription?.unsubscribe();

    const currentUid = this.userId;

    this.stockSubscription = this.dataService
      .getStocks(currentUid)
      .subscribe({

        next: (records: Stock[]) => {

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.stockEntries = [...(records || [])];

            console.log('Egg Production Records:', this.stockEntries);
            console.log('Eggs Today:', this.eggsToday);
            console.log('Average HDP:', this.averageHDP);

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Error loading egg production:', error);

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.stockEntries = [];
            this.cdr.detectChanges();

          });

        }

      });

  }

  // =====================================
  // LOAD HEALTH RECORDS
  // =====================================

  loadHealthRecords(): void {

    if (!this.userId) {
      this.healthRecords = [];
      return;
    }

    this.healthSubscription?.unsubscribe();

    const currentUid = this.userId;

    this.healthSubscription = this.dataService
      .getHealthRecords(currentUid)
      .subscribe({

        next: (records: HealthRecord[]) => {

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.healthRecords = records || [];

            this.cdr.detectChanges();

          });

        },

        error: (error) => {

          console.error('Error loading health records:', error);

          this.ngZone.run(() => {

            if (this.userId !== currentUid) return;

            this.healthRecords = [];
            this.cdr.detectChanges();

          });

        }

      });

  }

  // =====================================
  // TOTAL LAYING HENS
  // =====================================

  get totalLayingHens(): number {

    return this.flocks
      .filter(flock =>
        String(flock.status || '').toLowerCase() !== 'completed'
      )
      .reduce(
        (total, flock) =>
          total + Math.max(0, Number(flock.layingHens) || 0),
        0
      );

  }

  // =====================================
  // AVERAGE HDP
  // =====================================

  get averageHDP(): number {

    const layingHens = this.totalLayingHens;

    if (layingHens <= 0) {
      return 0;
    }

    const today = new Date();
    const currentMonth = this.getMonthKey(today);
    const daysElapsed = today.getDate();

    if (daysElapsed <= 0) {
      return 0;
    }

    const totalEggs = this.stockEntries
      .filter(stock =>
        this.getStockDate(stock).startsWith(currentMonth)
      )
      .reduce(
        (total, stock) =>
          total + this.getEggCount(stock),
        0
      );

    const possibleEggs = layingHens * daysElapsed;

    if (possibleEggs <= 0) {
      return 0;
    }

    return (totalEggs / possibleEggs) * 100;

  }

  // =====================================
  // SICK BIRDS
  // =====================================

  get sickBirds(): number {

    let totalSick = 0;

    const activeFlocks = this.flocks.filter(flock =>
      String(flock.status || '').toLowerCase() !== 'completed'
    );

    activeFlocks.forEach(flock => {

      if (!flock.id) return;

      const sickRecords = this.healthRecords.filter(record =>
        record.flockId === flock.id &&
        record.recordType === 'health' &&
        (
          record.status === 'sick' ||
          record.status === 'under-treatment'
        )
      );

      const sickInFlock = sickRecords.reduce(
        (sum, record) =>
          sum + Math.max(0, Number(record.affectedBirds) || 0),
        0
      );

      totalSick += Math.min(
        sickInFlock,
        Math.max(0, Number(flock.birds) || 0)
      );

    });

    return totalSick;

  }

  // =====================================
  // DEAD BIRDS
  // =====================================

  get deadBirds(): number {

    return this.healthRecords
      .filter(record =>
        record.recordType === 'mortality'
      )
      .reduce(
        (total, record) =>
          total + Math.max(0, Number(record.deadBirds) || 0),
        0
      );

  }

  // =====================================
  // HEALTH RATE
  // =====================================

  get healthyBirds(): number {

    return Math.max(
      0,
      this.totalBirdsCount - this.sickBirds
    );

  }

  get healthRate(): number {

    if (this.totalBirdsCount <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (this.healthyBirds / this.totalBirdsCount) * 100
      )
    );

  }

  // =====================================
  // DATE HELPERS
  // =====================================

  private getTodayDate(): string {
    return this.formatDateKey(new Date());
  }

  private formatDateKey(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  private getStockDate(stock: Stock): string {

    if (!stock.date) return '';

    return String(stock.date).substring(0, 10);

  }

  private getMonthKey(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    return `${year}-${month}`;

  }

  // =====================================
  // EGG COUNT
  // =====================================

  private getEggCount(stock: Stock): number {

    const trays = Math.max(0, Number(stock.trays) || 0);

    const looseEggs = Math.max(0, Number(stock.eggs) || 0);

    return (trays * 30) + looseEggs;

  }

  // =====================================
  // EGGS TODAY
  // =====================================

  get eggsToday(): number {

    const today = this.getTodayDate();

    return this.stockEntries
      .filter(stock =>
        this.getStockDate(stock) === today
      )
      .reduce(
        (total, stock) =>
          total + this.getEggCount(stock),
        0
      );

  }

  get totalTraysToday(): number {
    return this.eggsToday / 30;
  }

  // =====================================
  // THIS MONTH PRODUCTION
  // =====================================

  get traysThisMonth(): number {

    const currentMonth = this.getMonthKey(new Date());

    const totalEggs = this.stockEntries
      .filter(stock =>
        this.getStockDate(stock).startsWith(currentMonth)
      )
      .reduce(
        (total, stock) =>
          total + this.getEggCount(stock),
        0
      );

    return totalEggs / 30;

  }

  // =====================================
  // PREVIOUS MONTH PRODUCTION
  // =====================================

  get traysPreviousMonth(): number {

    const today = new Date();

    const previousMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const previousMonth = this.getMonthKey(previousMonthDate);

    const totalEggs = this.stockEntries
      .filter(stock =>
        this.getStockDate(stock).startsWith(previousMonth)
      )
      .reduce(
        (total, stock) =>
          total + this.getEggCount(stock),
        0
      );

    return totalEggs / 30;

  }

  // =====================================
  // MONTHLY DATA CHECKS
  // =====================================

  get hasCurrentMonthData(): boolean {

    const currentMonth = this.getMonthKey(new Date());

    return this.stockEntries.some(stock =>
      this.getStockDate(stock).startsWith(currentMonth) &&
      this.getEggCount(stock) > 0
    );

  }

  get hasPreviousMonthData(): boolean {

    const today = new Date();

    const previousMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const previousMonth = this.getMonthKey(previousMonthDate);

    return this.stockEntries.some(stock =>
      this.getStockDate(stock).startsWith(previousMonth) &&
      this.getEggCount(stock) > 0
    );

  }

  // =====================================
  // MONTHLY PRODUCTION CHANGE
  // =====================================

  get monthlyChange(): number {

    const previous = this.traysPreviousMonth;
    const current = this.traysThisMonth;

    if (previous <= 0) return 0;

    return ((current - previous) / previous) * 100;

  }

  get absoluteMonthlyChange(): number {
    return Math.abs(this.monthlyChange);
  }

  // =====================================
  // DROPDOWN
  // =====================================

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.closeDropdown();
    this.authService.logout();
  }

  // =====================================
  // NAVIGATION LOADER
  // =====================================

  showLoader(): void {

    this.isNavigating = true;

    this.cdr.detectChanges();

    setTimeout(() => {

      this.ngZone.run(() => {
        this.isNavigating = false;
        this.cdr.detectChanges();
      });

    }, 3000);

  }

  // =====================================
  // CLEANUP
  // =====================================

  ngOnDestroy(): void {

    this.authSubscription?.unsubscribe();

    this.unsubscribeUserSubscriptions();

  }

}
