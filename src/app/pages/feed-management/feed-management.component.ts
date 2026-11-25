import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth, authState } from '@angular/fire/auth';
import { DataService, FeedPurchase, FeedRecord } from '../../services/data.service';
import { Flock } from '../../models/model';

import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-feed-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="feed-page">

      <!-- HEADER -->
      <header class="top-header">
        <div class="header-left">
          <a routerLink="/home" class="back-btn">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </a>
          <div class="brand">
            <div>
              <h2>Feed Management</h2>
            </div>
          </div>
        </div>
      </header>

      <main class="content">

        <!-- LOADING -->
        <div class="loading-container" *ngIf="loading">
          <div class="loader"></div>
          <p>Inapakia taarifa za chakula...</p>
        </div>

        <ng-container *ngIf="!loading">

          <!-- DASHBOARD SUMMARY -->
          <section class="summary-grid">
            <div class="summary-card">
              <div class="summary-top">
                <div class="summary-icon green-icon"><ion-icon name="cube-outline"></ion-icon></div>
                <span class="summary-label">Available Feed</span>
              </div>
              <h2>{{ totalAvailableFeed | number:'1.0-1' }} <small>kg</small></h2>
              <p><ion-icon name="checkmark-circle"></ion-icon> Current inventory</p>
            </div>

            <div class="summary-card">
              <div class="summary-top">
                <div class="summary-icon blue-icon"><ion-icon name="pulse-outline"></ion-icon></div>
                <span class="summary-label">Today's Use</span>
              </div>
              <h2>{{ todayConsumption | number:'1.0-1' }} <small>kg</small></h2>
              <p>Given to all flocks</p>
            </div>

            <div class="summary-card">
              <div class="summary-top">
                <div class="summary-icon orange-icon"><ion-icon name="trending-down-outline"></ion-icon></div>
                <span class="summary-label">Monthly Use</span>
              </div>
              <h2>{{ monthlyConsumption | number:'1.0-1' }} <small>kg</small></h2>
              <p>This month</p>
            </div>

            <div class="summary-card">
              <div class="summary-top">
                <div class="summary-icon purple-icon"><ion-icon name="cash-outline"></ion-icon></div>
                <span class="summary-label">Expenses</span>
              </div>
              <h2 class="expense-value">{{ formatCurrency(monthlyFeedCost) }}</h2>
              <p>Feed purchases</p>
            </div>
          </section>

          <!-- SECONDARY STATISTICS -->
          <section class="secondary-grid">
            <div class="secondary-card">
              <div class="secondary-icon"><ion-icon name="calendar-outline"></ion-icon></div>
              <div>
                <span>Stock Duration</span>
                <h3>{{ estimatedDaysRemaining }} <small>days</small></h3>
              </div>
            </div>

            <div class="secondary-card">
              <div class="secondary-icon"><ion-icon name="egg-outline"></ion-icon></div>
              <div>
                <span>Farm Population</span>
                <h3>{{ totalBirds | number }}</h3>
              </div>
            </div>

            <div class="secondary-card">
              <div class="secondary-icon warning-icon"><ion-icon name="warning-outline"></ion-icon></div>
              <div>
                <span>Low Stock</span>
                <h3>{{ lowStockItems.length }} <small>Alerts</small></h3>
              </div>
            </div>
          </section>

          <!-- NAVIGATION TABS -->
          <nav class="tabs">
            <button [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
              <ion-icon name="grid-outline"></ion-icon> Overview
            </button>
            <button [class.active]="activeTab === 'inventory'" (click)="setTab('inventory')">
              <ion-icon name="file-tray-stacked-outline"></ion-icon> Inventory
            </button>
            <button [class.active]="activeTab === 'feeding'" (click)="setTab('feeding')">
              <ion-icon name="clipboard-outline"></ion-icon> Feeding
            </button>
            <button [class.active]="activeTab === 'purchases'" (click)="setTab('purchases')">
              <ion-icon name="cart-outline"></ion-icon> Purchases
            </button>
          </nav>

          <!-- ================================= -->
          <!-- OVERVIEW TAB -->
          <!-- ================================= -->
          <section *ngIf="activeTab === 'overview'" class="tab-content">
            <div class="action-row-mobile">
              <button class="btn btn-outline" (click)="openPurchaseForm()">
                <ion-icon name="add-circle-outline"></ion-icon> Add Feed Stock
              </button>
              <button class="btn btn-primary" (click)="openFeedingForm()">
                <ion-icon name="checkbox-outline"></ion-icon> Record Feeding
              </button>
            </div>

            <!-- INVENTORY OVERVIEW -->
            <div class="panel">
              <div class="panel-header">
                <div>
                  <h3>Feed Inventory</h3>
                  <p>Current feed stock by category</p>
                </div>
                <button class="view-button" (click)="setTab('inventory')">
                  View All <ion-icon name="arrow-forward-outline"></ion-icon>
                </button>
              </div>

              <div class="empty-state" *ngIf="feedStocks.length === 0">
                <ion-icon name="cube-outline"></ion-icon>
                <h4>No Feed Inventory</h4>
                <p>Record your first feed purchase to get started.</p>
                <button class="btn btn-primary" (click)="openPurchaseForm()">Add Feed Stock</button>
              </div>

              <div class="inventory-list" *ngIf="feedStocks.length > 0">
                <div class="inventory-item" *ngFor="let feed of feedStocks | slice:0:3">
                  <div class="inventory-top">
                    <div class="feed-name">
                      <div class="feed-icon"><ion-icon name="basket-outline"></ion-icon></div>
                      <div>
                        <strong>{{ feed.feedType }}</strong>
                        <small>Purchased {{ feed.purchasedKg | number:'1.0-1' }} kg</small>
                      </div>
                    </div>
                    <span class="stock-badge" [class.low]="feed.lowStock">
                      {{ feed.lowStock ? 'Low Stock' : 'Available' }}
                    </span>
                  </div>

                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="feed.purchasedKg > 0 ? (feed.availableKg / feed.purchasedKg * 100) : 0"></div>
                  </div>

                  <div class="inventory-bottom">
                    <span>Consumed: {{ feed.consumedKg | number:'1.0-1' }} kg</span>
                    <strong>{{ feed.availableKg | number:'1.0-1' }} kg left</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- FLOCK SUMMARY -->
            <div class="panel">
              <div class="panel-header">
                <div>
                  <h3>Flock Feeding Summary</h3>
                  <p>Daily feed consumption per flock</p>
                </div>
                <button class="icon-button" (click)="openFeedingForm()">
                  <ion-icon name="add-outline"></ion-icon>
                </button>
              </div>

              <div class="empty-state" *ngIf="flocks.length === 0">
                <ion-icon name="egg-outline"></ion-icon>
                <h4>No Flocks Found</h4>
                <p>Add a flock to start tracking feeding.</p>
              </div>

              <div class="flock-list" *ngIf="flocks.length > 0">
                <div class="flock-item" *ngFor="let flock of flocks">
                  <div class="flock-avatar"><ion-icon name="egg"></ion-icon></div>
                  <div class="flock-info">
                    <strong>{{ flock.name }}</strong>
                    <small>{{ flock.birds | number }} birds</small>
                  </div>
                  <div class="flock-consumption">
                    <strong>{{ getFlockTodayConsumption(flock.id!) | number:'1.0-2' }} kg</strong>
                    <small>{{ getFlockFeedPerBird(flock.id!) | number:'1.0-1' }} g / bird</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- STOCK ALERTS -->
            <div class="panel alerts-panel">
              <div class="panel-header">
                <div>
                  <h3>Feed Stock Alerts</h3>
                  <p>Monitor feed types that need replenishment</p>
                </div>
                <span class="alert-count">{{ lowStockItems.length }} Alerts</span>
              </div>

              <div class="success-message" *ngIf="lowStockItems.length === 0">
                <ion-icon name="checkmark-circle"></ion-icon> All feed stock levels are healthy.
              </div>

              <div class="alert-row" *ngFor="let feed of lowStockItems">
                <div class="alert-feed-icon"><ion-icon name="warning-outline"></ion-icon></div>
                <div class="alert-details">
                  <strong>{{ feed.feedType }}</strong>
                  <small>Only {{ feed.availableKg | number:'1.0-2' }} kg remaining</small>
                </div>
                <span class="stock-badge low">Reorder</span>
              </div>
            </div>
          </section>

          <!-- ================================= -->
          <!-- INVENTORY TAB -->
          <!-- ================================= -->
          <section *ngIf="activeTab === 'inventory'" class="tab-content">
            <div class="action-row-mobile">
              <button class="btn btn-primary w-100" (click)="openPurchaseForm()">
                <ion-icon name="add-circle-outline"></ion-icon> Add Feed Stock
              </button>
            </div>

            <div class="panel">
              <div class="panel-header">
                <div>
                  <h3>All Inventory</h3>
                  <p>Manage and monitor available feed</p>
                </div>
              </div>

              <div class="list-card-view" *ngFor="let feed of feedStocks">
                <div class="list-header-row">
                  <h4>{{ feed.feedType }}</h4>
                  <span class="stock-badge" [class.low]="feed.lowStock">
                    {{ feed.lowStock ? 'Low Stock' : 'Healthy' }}
                  </span>
                </div>
                <div class="list-detail-row">
                  <span>Purchased:</span> <strong>{{ feed.purchasedKg | number:'1.0-2' }} kg</strong>
                </div>
                <div class="list-detail-row">
                  <span>Consumed:</span> <strong>{{ feed.consumedKg | number:'1.0-2' }} kg</strong>
                </div>
                <div class="list-detail-row">
                  <span>Available:</span> <strong class="text-success">{{ feed.availableKg | number:'1.0-2' }} kg</strong>
                </div>
                <div class="list-detail-row">
                  <span>Avg Price/kg:</span> <strong>{{ formatCurrency(feed.averagePricePerKg) }}</strong>
                </div>
              </div>

              <div class="empty-state" *ngIf="feedStocks.length === 0">
                <ion-icon name="cube-outline"></ion-icon>
                <h4>No Inventory</h4>
                <p>No feed inventory found.</p>
              </div>
            </div>
          </section>

          <!-- ================================= -->
          <!-- FEEDING TAB (with Edit + Delete) -->
          <!-- ================================= -->
          <section *ngIf="activeTab === 'feeding'" class="tab-content">
            <div class="action-row-mobile">
              <button class="btn btn-primary w-100" (click)="openFeedingForm()">
                <ion-icon name="checkbox-outline"></ion-icon> Record Daily Feeding
              </button>
            </div>

            <div class="panel">
              <div class="panel-header">
                <div>
                  <h3>Feeding Records</h3>
                  <p>History of feed consumption</p>
                </div>
              </div>

              <div class="list-card-view" *ngFor="let record of feedingRecords">
                <div class="list-header-row">
                  <h4>{{ record.flockName }}</h4>
                  <span class="date-badge">{{ record.feedingDate | date:'mediumDate' }}</span>
                </div>
                <div class="list-detail-row">
                  <span>Birds:</span> <strong>{{ record.birdsCount | number }}</strong>
                </div>
                <div class="list-detail-row">
                  <span>Feed Type:</span> <strong>{{ record.feedType }}</strong>
                </div>
                <div class="list-detail-row">
                  <span>Quantity:</span> <strong class="text-success">{{ record.quantityKg | number:'1.0-2' }} kg</strong>
                </div>
                <div class="list-detail-row">
                  <span>Grams/Bird:</span>
                  <strong>
                    {{ record.birdsCount > 0 ? (record.quantityKg * 1000 / record.birdsCount | number:'1.0-1') : 0 }} g
                  </strong>
                </div>

                <div class="card-actions">
                  <button class="text-action-btn edit-btn" (click)="editFeeding(record)">
                    <ion-icon name="create-outline"></ion-icon> Edit
                  </button>
                  <button class="text-action-btn delete-btn" (click)="deleteFeeding(record)">
                    <ion-icon name="trash-outline"></ion-icon> Delete
                  </button>
                </div>
              </div>

              <div class="empty-state" *ngIf="feedingRecords.length === 0">
                <ion-icon name="clipboard-outline"></ion-icon>
                <h4>No Records</h4>
                <p>No feeding records available.</p>
              </div>
            </div>
          </section>

          <!-- ================================= -->
          <!-- PURCHASES TAB (with Edit + Delete) -->
          <!-- ================================= -->
          <section *ngIf="activeTab === 'purchases'" class="tab-content">
            <div class="action-row-mobile">
              <button class="btn btn-primary w-100" (click)="openPurchaseForm()">
                <ion-icon name="cart-outline"></ion-icon> Record New Purchase
              </button>
            </div>

            <div class="panel">
              <div class="panel-header">
                <div>
                  <h3>Purchase History</h3>
                  <p>Track feed procurement expenses</p>
                </div>
              </div>

              <div class="purchase-summary">
                <span>Total Purchase Expenses</span>
                <strong>{{ formatCurrency(totalPurchaseCost) }}</strong>
              </div>

              <div class="list-card-view" *ngFor="let purchase of purchases">
                <div class="list-header-row">
                  <h4>{{ purchase.feedType }}</h4>
                  <span class="date-badge">{{ purchase.purchaseDate | date:'mediumDate' }}</span>
                </div>
                <div class="list-detail-row">
                  <span>Supplier:</span> <strong>{{ purchase.supplier || '-' }}</strong>
                </div>
                <div class="list-detail-row">
                  <span>Quantity:</span> <strong>{{ purchase.quantityKg | number:'1.0-2' }} kg</strong>
                </div>
                <div class="list-detail-row">
                  <span>Price/kg:</span> <strong>{{ formatCurrency(purchase.pricePerKg) }}</strong>
                </div>
                <div class="list-detail-row">
                  <span>Total Cost:</span> <strong class="text-success">{{ formatCurrency(purchase.totalCost) }}</strong>
                </div>

                <div class="card-actions">
                  <button class="text-action-btn edit-btn" (click)="editPurchase(purchase)">
                    <ion-icon name="create-outline"></ion-icon> Edit
                  </button>
                  <button class="text-action-btn delete-btn" (click)="deletePurchase(purchase)">
                    <ion-icon name="trash-outline"></ion-icon> Delete
                  </button>
                </div>
              </div>

              <div class="empty-state" *ngIf="purchases.length === 0">
                <ion-icon name="cart-outline"></ion-icon>
                <h4>No Purchases</h4>
                <p>No purchases recorded.</p>
              </div>
            </div>
          </section>

        </ng-container>
      </main>

      <!-- BOTTOM NAVIGATION -->
      <nav class="bottom-nav">
        <a routerLink="/home">
          <ion-icon name="home-outline"></ion-icon>
          <span>Home</span>
        </a>
        <a routerLink="/reports">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <span>Ripoti</span>
        </a>
        <a routerLink="/manage-flock">
          <ion-icon name="egg-outline"></ion-icon>
          <span>Flock</span>
        </a>
        <a routerLink="/feed-management" class="active">
          <ion-icon name="leaf"></ion-icon>
          <span>Feed</span>
        </a>
        <a routerLink="/my-profile">
          <ion-icon name="settings-outline"></ion-icon>
          <span>Mipangilio</span>
        </a>
      </nav>

      <!-- ======================================= -->
      <!-- ADD / EDIT FEED PURCHASE MODAL -->
      <!-- ======================================= -->
      <div class="modal-backdrop" *ngIf="showPurchaseForm" (click)="closePurchaseForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">FEED INVENTORY</span>
              <h2>{{ editingPurchaseId ? 'Edit Feed Stock' : 'Add Feed Stock' }}</h2>
            </div>
            <button type="button" class="close-button" (click)="closePurchaseForm()">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>
          </div>

          <form #purchaseNgForm="ngForm" (ngSubmit)="savePurchase()">
            <div class="form-group">
              <label>Feed Type *</label>
              <select name="purchaseFeedType" [(ngModel)]="purchaseForm.feedType" required>
                <option *ngFor="let type of feedTypes" [value]="type">{{ type }}</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity (KG) *</label>
                <input type="number" name="purchaseQuantity" [(ngModel)]="purchaseForm.quantityKg" min="0.01" step="0.01" placeholder="e.g. 500" required>
              </div>
              <div class="form-group">
                <label>Price per KG (TSh) *</label>
                <input type="number" name="purchasePrice" [(ngModel)]="purchaseForm.pricePerKg" min="0.01" step="0.01" placeholder="e.g. 1800" required>
              </div>
            </div>

            <div class="form-group">
              <label>Supplier Name</label>
              <input type="text" name="supplier" [(ngModel)]="purchaseForm.supplier" placeholder="Enter supplier name">
            </div>

            <div class="form-group">
              <label>Purchase Date *</label>
              <input type="date" name="purchaseDate" [(ngModel)]="purchaseForm.purchaseDate" [max]="today()" required>
            </div>

            <div class="total-preview">
              <div>
                <span>Total Cost</span>
                <small>Quantity × Price</small>
              </div>
              <strong>{{ formatCurrency(purchaseForm.quantityKg * purchaseForm.pricePerKg) }}</strong>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" [disabled]="saving" (click)="closePurchaseForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving || purchaseNgForm.invalid">
                {{ saving ? 'Saving...' : (editingPurchaseId ? 'Update Purchase' : 'Save Purchase') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ======================================= -->
      <!-- ADD / EDIT DAILY FEEDING MODAL -->
      <!-- ======================================= -->
      <div class="modal-backdrop" *ngIf="showFeedingForm" (click)="closeFeedingForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">FLOCK MANAGEMENT</span>
              <h2>{{ editingFeedingId ? 'Edit Feeding' : 'Record Feeding' }}</h2>
            </div>
            <button type="button" class="close-button" (click)="closeFeedingForm()">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>
          </div>

          <form #feedingNgForm="ngForm" (ngSubmit)="saveFeeding()">
            <div class="form-group">
              <label>Select Flock *</label>
              <select name="flockId" [(ngModel)]="feedingForm.flockId" (ngModelChange)="onFlockChange()" required>
                <option value="">Choose flock</option>
                <option *ngFor="let flock of flocks" [value]="flock.id">{{ flock.name }} ({{ flock.birds }} birds)</option>
              </select>
            </div>

            <div class="flock-preview" *ngIf="feedingForm.flockId">
              <div class="preview-icon"><ion-icon name="egg"></ion-icon></div>
              <div>
                <strong>{{ feedingForm.flockName }}</strong>
                <small>{{ feedingForm.birdsCount | number }} birds</small>
              </div>
            </div>

            <div class="form-group">
              <label>Feed Type *</label>
              <select name="feedingFeedType" [(ngModel)]="feedingForm.feedType" required>
                <option *ngFor="let type of feedTypes" [value]="type">{{ type }}</option>
              </select>
              <div class="available-stock">
                <ion-icon name="cube-outline"></ion-icon> Available Stock:
                <strong>{{ getAvailableFeed(feedingForm.feedType) | number:'1.0-2' }} kg</strong>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity (KG) *</label>
                <input type="number" name="feedingQuantity" [(ngModel)]="feedingForm.quantityKg" min="0.01" step="0.01" placeholder="e.g. 45" required>
              </div>
              <div class="form-group">
                <label>Feeding Date *</label>
                <input type="date" name="feedingDate" [(ngModel)]="feedingForm.feedingDate" [max]="today()" required>
              </div>
            </div>

            <div class="feeding-preview" *ngIf="feedingForm.birdsCount > 0 && feedingForm.quantityKg > 0">
              <span>Est. Feed per Bird</span>
              <strong>{{ feedingForm.quantityKg * 1000 / feedingForm.birdsCount | number:'1.0-1' }} g</strong>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" [disabled]="saving" (click)="closeFeedingForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving || feedingNgForm.invalid || flocks.length === 0">
                {{ saving ? 'Saving...' : (editingFeedingId ? 'Update Feeding' : 'Save Feeding') }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f4f7fc;
      min-height: 100vh;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #14264d;
    }

    * { box-sizing: border-box; }

    .feed-page {
      min-height: 100vh;
      padding-bottom: 85px;
    }

    .top-header {
      background: linear-gradient(135deg, #4b1d8f 0%, #6a3bbd 100%);
      color: white;
      padding: 16px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom-left-radius: 24px;
      border-bottom-right-radius: 24px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .back-btn {
      color: white;
      font-size: 24px;
      display: flex;
      align-items: center;
      text-decoration: none;
      cursor: pointer;
    }

    .brand h2 {
      font-size: 18px;
      margin: 0;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .content {
      max-width: 1000px;
      margin: auto;
      padding: 20px 14px;
    }

    .loading-container {
      text-align: center;
      padding: 50px 20px;
    }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4b1d8f;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 4px;
    }

    .summary-card {
      background: white;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .summary-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .summary-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .green-icon { background: #effbf4; color: #14944e; }
    .blue-icon { background: #edf4ff; color: #1265e8; }
    .orange-icon { background: #fff7ed; color: #ec9425; }
    .purple-icon { background: #f0f4ff; color: #7047F5; }

    .summary-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-align: right;
      max-width: 60%;
    }

    .summary-card h2 {
      margin: 0 0 5px 0;
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
    }

    .summary-card h2 small {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }

    .summary-card .expense-value {
      font-size: 16px;
    }

    .summary-card p {
      margin: 0;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .summary-card p ion-icon {
      color: #14944e;
    }

    .secondary-grid {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 10px;
      margin-bottom: 16px;
      scrollbar-width: none;
    }
    .secondary-grid::-webkit-scrollbar { display: none; }

    .secondary-card {
      flex: 0 0 auto;
      background: white;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      min-width: 140px;
    }

    .secondary-icon {
      font-size: 20px;
      color: #4b1d8f;
      background: #f0f4ff;
      padding: 8px;
      border-radius: 50%;
    }

    .secondary-card span {
      font-size: 10px;
      color: #64748b;
      display: block;
      margin-bottom: 2px;
    }

    .secondary-card h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
    }

    .secondary-card h3 small {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
    }

    .warning-icon { color: #ec9425; background: #fff7ed; }

    .tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 10px;
      margin-bottom: 16px;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }

    .tabs button {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tabs button ion-icon { font-size: 16px; }

    .tabs button.active {
      background: #4b1d8f;
      color: white;
      border-color: #4b1d8f;
      box-shadow: 0 4px 10px rgba(75, 29, 143, 0.2);
    }

    .action-row-mobile {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: 0.2s;
    }

    .btn-primary { background: #4b1d8f; color: white; box-shadow: 0 4px 10px rgba(75, 29, 143, 0.2); }
    .btn-outline { background: white; color: #4b1d8f; border: 1px solid #4b1d8f; }
    .btn-primary:disabled, .btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }

    .panel {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .panel-header h3 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 800;
    }

    .panel-header p {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }

    .view-button {
      background: transparent;
      border: none;
      color: #4b1d8f;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 0;
    }

    .icon-button {
      background: #f0f4ff;
      border: none;
      color: #4b1d8f;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: 30px 20px;
    }

    .empty-state ion-icon { font-size: 40px; color: #cbd5e1; margin-bottom: 10px; }
    .empty-state h4 { margin: 0 0 5px; font-size: 14px; color: #334155; }
    .empty-state p { margin: 0 0 15px; font-size: 12px; color: #64748b; }

    .inventory-item {
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .inventory-item:last-child { border: none; margin: 0; padding: 0; }

    .inventory-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .feed-name { display: flex; align-items: center; gap: 10px; }

    .feed-icon {
      background: #f0f4ff;
      color: #4b1d8f;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .feed-name strong { display: block; font-size: 13px; }
    .feed-name small { font-size: 10px; color: #64748b; }

    .stock-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      background: #effbf4;
      color: #14944e;
    }
    .stock-badge.low { background: #fff7ed; color: #ec9425; }

    .progress-track {
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: #4b1d8f;
      border-radius: 3px;
    }

    .inventory-bottom {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    .inventory-bottom strong { color: #1e293b; }

    .flock-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .flock-item:last-child { border: none; padding-bottom: 0; }

    .flock-avatar {
      width: 36px;
      height: 36px;
      background: #f0f4ff;
      color: #4b1d8f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .flock-info { flex: 1; }
    .flock-info strong { display: block; font-size: 13px; }
    .flock-info small { font-size: 10px; color: #64748b; }

    .flock-consumption { text-align: right; }
    .flock-consumption strong { display: block; font-size: 13px; color: #4b1d8f; }
    .flock-consumption small { font-size: 10px; color: #64748b; }

    .alert-count {
      background: #fff7ed;
      color: #ec9425;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 10px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #effbf4;
      color: #14944e;
      padding: 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    .alert-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff7ed;
      padding: 10px;
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .alert-feed-icon { color: #ec9425; font-size: 20px; }
    .alert-details { flex: 1; }
    .alert-details strong { display: block; font-size: 12px; color: #1e293b; }
    .alert-details small { font-size: 10px; color: #64748b; }

    .list-card-view {
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 10px;
      border: 1px solid #f1f5f9;
    }

    .list-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .list-header-row h4 { margin: 0; font-size: 14px; color: #1e293b; }

    .date-badge {
      background: #e2e8f0;
      color: #475569;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 10px;
    }

    .list-detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .list-detail-row:last-child { margin-bottom: 0; }
    .list-detail-row strong { color: #1e293b; }
    .list-detail-row .text-success { color: #14944e; }

    /* ============================================ */
    /* NEW: card action buttons (Edit / Delete)    */
    /* ============================================ */
    .card-actions {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #e2e8f0;
    }

    .text-action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0;
    }

    .text-action-btn ion-icon { font-size: 15px; }
    .edit-btn { color: #1265e8; }
    .delete-btn { color: #c52222; }

    .purchase-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f4ff;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 15px;
    }
    .purchase-summary span { font-size: 12px; font-weight: 600; color: #4b1d8f; }
    .purchase-summary strong { font-size: 16px; color: #4b1d8f; }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 20;
      background: white;
      border-top: 1px solid #e1e7f0;
      display: flex;
      justify-content: space-around;
      padding: 9px 3px 7px;
    }

    .bottom-nav a {
      text-decoration: none;
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
    }

    .bottom-nav ion-icon { font-size: 24px; }

    .bottom-nav .active {
      color: #4b1d8f;
    }
    .bottom-nav .active ion-icon {
      border-bottom: 3px solid #4b1d8f;
      padding-bottom: 2px;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #101d35a8;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding: 0;
    }

    @media(min-width: 600px) {
      .modal-backdrop { align-items: center; padding: 15px; }
    }

    .modal-content {
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      background: white;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      padding: 22px;
      animation: slideUp 0.3s ease-out;
    }

    @media(min-width: 600px) {
      .modal-content { border-radius: 20px; }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .modal-eyebrow {
      font-size: 10px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    .modal-header h2 { margin: 4px 0 0; font-size: 20px; color: #1e293b; }

    .close-button {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      background: #f8fafc;
    }

    .form-group input:focus,
    .form-group select:focus {
      border-color: #4b1d8f;
      background: white;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .total-preview {
      background: #f0f4ff;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .total-preview span { display: block; font-size: 12px; font-weight: 700; color: #4b1d8f; }
    .total-preview small { font-size: 10px; color: #64748b; }
    .total-preview strong { font-size: 18px; color: #4b1d8f; }

    .flock-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      padding: 10px;
      border-radius: 10px;
      margin-bottom: 15px;
      border: 1px solid #f1f5f9;
    }

    .preview-icon {
      width: 36px;
      height: 36px;
      background: #effbf4;
      color: #14944e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .flock-preview strong { display: block; font-size: 13px; }
    .flock-preview small { font-size: 11px; color: #64748b; }

    .available-stock {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }

    .feeding-preview {
      display: flex;
      justify-content: space-between;
      background: #effbf4;
      padding: 10px 12px;
      border-radius: 10px;
      margin-bottom: 15px;
      font-size: 12px;
      color: #14944e;
      font-weight: 600;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .modal-actions button {
      flex: 1;
      padding: 14px;
    }

    .w-100 { width: 100%; }
  `]
})
export class FeedManagementComponent implements OnInit, OnDestroy {

  private authSubscription?: Subscription;
  private flockSubscription?: Subscription;
  private purchaseSubscription?: Subscription;
  private feedingSubscription?: Subscription;

  private userId = '';
  loading = true;
  saving = false;
  activeTab = 'overview';

  feedTypes = ['Starter Feed', 'Grower Feed', 'Layer Mash', 'Broiler Finisher', 'Kienyeji Mix'];

  // Data Arrays
  flocks: Flock[] = [];
  purchases: FeedPurchase[] = [];
  feedingRecords: FeedRecord[] = [];

  // Modals
  showPurchaseForm = false;
  showFeedingForm = false;

  // Edit tracking (null = add mode)
  editingPurchaseId: string | null = null;
  editingFeedingId: string | null = null;

  // Forms
  purchaseForm = {
    feedType: 'Layer Mash',
    quantityKg: 0,
    pricePerKg: 0,
    supplier: '',
    purchaseDate: this.today()
  };

  feedingForm = {
    flockId: '',
    flockName: '',
    birdsCount: 0,
    feedType: 'Layer Mash',
    quantityKg: 0,
    feedingDate: this.today()
  };

  constructor(
    private auth: Auth,
    private dataService: DataService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authSubscription = authState(this.auth).subscribe(user => {
      this.ngZone.run(() => {
        this.flockSubscription?.unsubscribe();
        this.purchaseSubscription?.unsubscribe();
        this.feedingSubscription?.unsubscribe();

        if (!user) {
          this.userId = '';
          this.flocks = [];
          this.purchases = [];
          this.feedingRecords = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.userId = user.uid;
        this.loadData();
      });
    });
  }

  loadData(): void {
    this.loading = true;

    // 1. Load Flocks
    this.flockSubscription = this.dataService.getFlocks(this.userId).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.flocks = data || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error loading flocks:', err)
    });

    // 2. Load Feed Purchases (Inventory)
    this.purchaseSubscription = this.dataService.getFeedPurchases(this.userId).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.purchases = data || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading purchases:', err);
        this.loading = false;
      }
    });

    // 3. Load Feeding Records (Consumption)
    this.feedingSubscription = this.dataService.getFeedRecords(this.userId).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.feedingRecords = data || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading feeding records:', err);
        this.loading = false;
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  // ==============================
  // DYNAMIC INVENTORY CALCULATION
  // ==============================
  get feedStocks(): any[] {
    const stockMap = new Map<string, any>();

    // 1. Process Purchases (Adds to Inventory)
    this.purchases.forEach(p => {
      if (!stockMap.has(p.feedType)) {
        stockMap.set(p.feedType, {
          feedType: p.feedType,
          purchasedKg: 0,
          consumedKg: 0,
          availableKg: 0,
          totalCost: 0,
          averagePricePerKg: 0,
          lowStock: false
        });
      }
      const stock = stockMap.get(p.feedType);
      stock.purchasedKg += Number(p.quantityKg) || 0;
      stock.totalCost += Number(p.totalCost) || 0;
    });

    // 2. Calculate Average Price
    stockMap.forEach(stock => {
      if (stock.purchasedKg > 0) {
        stock.averagePricePerKg = stock.totalCost / stock.purchasedKg;
      }
    });

    // 3. Process Feeding Records (Subtracts from Inventory)
    this.feedingRecords.forEach(r => {
      if (!stockMap.has(r.feedType)) {
        stockMap.set(r.feedType, {
          feedType: r.feedType,
          purchasedKg: 0,
          consumedKg: 0,
          availableKg: 0,
          totalCost: 0,
          averagePricePerKg: 0,
          lowStock: false
        });
      }
      const stock = stockMap.get(r.feedType);
      stock.consumedKg += Number(r.quantityKg) || 0;
    });

    // 4. Finalize Available Kg and Low Stock Status
    const result = Array.from(stockMap.values());
    result.forEach(stock => {
      stock.availableKg = stock.purchasedKg - stock.consumedKg;
      stock.lowStock = stock.availableKg < 100; // Threshold for Low Stock (100kg)
    });

    return result;
  }

  // ==============================
  // CALCULATIONS (GETTERS)
  // ==============================

  get totalAvailableFeed(): number {
    return this.feedStocks.reduce((sum, item) => sum + (Number(item.availableKg) || 0), 0);
  }

  get todayConsumption(): number {
    const todayStr = this.today();
    return this.feedingRecords
      .filter(r => this.formatDateForComparison(r.feedingDate) === todayStr)
      .reduce((sum, r) => sum + (Number(r.quantityKg) || 0), 0);
  }

  get monthlyConsumption(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.feedingRecords
      .filter(r => {
        const d = new Date(r.feedingDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + (Number(r.quantityKg) || 0), 0);
  }

  get monthlyFeedCost(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.purchases
      .filter(p => {
        const d = new Date(p.purchaseDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }

  get totalPurchaseCost(): number {
    return this.purchases.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }

  get estimatedDaysRemaining(): number {
    if (this.todayConsumption <= 0) return 0;
    return Math.floor(this.totalAvailableFeed / this.todayConsumption);
  }

  get totalBirds(): number {
    return this.flocks
      .filter(f => f.status !== 'Completed')
      .reduce((sum, f) => sum + (Number(f.birds) || 0), 0);
  }

  get lowStockItems(): any[] {
    return this.feedStocks.filter(f => f.lowStock);
  }

  getFlockTodayConsumption(flockId: string): number {
    const todayStr = this.today();
    return this.feedingRecords
      .filter(r => r.flockId === flockId && this.formatDateForComparison(r.feedingDate) === todayStr)
      .reduce((sum, r) => sum + (Number(r.quantityKg) || 0), 0);
  }

  getFlockFeedPerBird(flockId: string): number {
    const flock = this.flocks.find(f => f.id === flockId);
    if (!flock || flock.birds === 0) return 0;
    const consumption = this.getFlockTodayConsumption(flockId);
    return (consumption * 1000) / flock.birds;
  }

  getAvailableFeed(feedType: string): number {
    const feed = this.feedStocks.find(f => f.feedType === feedType);
    return feed ? Number(feed.availableKg) : 0;
  }

  // ==============================
  // HELPERS
  // ==============================

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForComparison(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value.substring(0, 10);
    if (value.toDate) return value.toDate().toISOString().split('T')[0];
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return '';
  }

  formatDateForInput(value: any): string {
    if (!value) return this.today();
    if (typeof value === 'string') return value.substring(0, 10);
    if (value.toDate) return value.toDate().toISOString().split('T')[0];
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return this.today();
  }

  formatCurrency(value: number): string {
    if (!value) return 'TSh 0';
    return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(value);
  }

  onFlockChange() {
    const flock = this.flocks.find(f => f.id === this.feedingForm.flockId);
    if (flock) {
      this.feedingForm.flockName = flock.name;
      this.feedingForm.birdsCount = Number(flock.birds) || 0;
    } else {
      this.feedingForm.flockName = '';
      this.feedingForm.birdsCount = 0;
    }
  }

  // ==============================
  // MODALS (with edit state reset)
  // ==============================

  openPurchaseForm() {
    this.editingPurchaseId = null;
    this.purchaseForm = {
      feedType: 'Layer Mash',
      quantityKg: 0,
      pricePerKg: 0,
      supplier: '',
      purchaseDate: this.today()
    };
    this.showPurchaseForm = true;
  }

  closePurchaseForm() {
    this.showPurchaseForm = false;
    this.editingPurchaseId = null;
  }

  openFeedingForm() {
    this.editingFeedingId = null;
    this.feedingForm = {
      flockId: '',
      flockName: '',
      birdsCount: 0,
      feedType: 'Layer Mash',
      quantityKg: 0,
      feedingDate: this.today()
    };
    this.showFeedingForm = true;
  }

  closeFeedingForm() {
    this.showFeedingForm = false;
    this.editingFeedingId = null;
  }

  // ==============================
  // EDIT PURCHASE
  // ==============================

  editPurchase(purchase: FeedPurchase) {
    if (!purchase.id) return;

    this.editingPurchaseId = purchase.id;
    this.purchaseForm = {
      feedType: purchase.feedType,
      quantityKg: Number(purchase.quantityKg) || 0,
      pricePerKg: Number(purchase.pricePerKg) || 0,
      supplier: purchase.supplier || '',
      purchaseDate: this.formatDateForInput(purchase.purchaseDate)
    };
    this.showPurchaseForm = true;
  }

  // ==============================
  // EDIT FEEDING
  // ==============================

  editFeeding(record: FeedRecord) {
    if (!record.id) return;

    this.editingFeedingId = record.id;
    this.feedingForm = {
      flockId: record.flockId,
      flockName: record.flockName,
      birdsCount: Number(record.birdsCount) || 0,
      feedType: record.feedType,
      quantityKg: Number(record.quantityKg) || 0,
      feedingDate: this.formatDateForInput(record.feedingDate)
    };
    this.showFeedingForm = true;
  }

  // ==============================
  // DELETE PURCHASE
  // ==============================

  async deletePurchase(purchase: FeedPurchase) {
    if (!purchase.id) return;

    const result = await Swal.fire({
      title: 'Delete Purchase?',
      html: `Je, una uhakika unataka kufuta ununuzi wa <strong>${purchase.feedType}</strong> (${purchase.quantityKg} kg)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c52222',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await this.dataService.deleteFeedPurchase(purchase.id);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Purchase has been deleted successfully.',
        timer: 1800,
        showConfirmButton: false
      });
      this.ngZone.run(() => this.cdr.detectChanges());
    } catch (error) {
      console.error('Error deleting purchase:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete purchase.' });
    }
  }

  // ==============================
  // DELETE FEEDING
  // ==============================

  async deleteFeeding(record: FeedRecord) {
    if (!record.id) return;

    const result = await Swal.fire({
      title: 'Delete Feeding Record?',
      html: `Je, una uhakika unataka kufuta rekodi ya <strong>${record.flockName}</strong> (${record.quantityKg} kg)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c52222',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await this.dataService.deleteFeedRecord(record.id);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Feeding record has been deleted successfully.',
        timer: 1800,
        showConfirmButton: false
      });
      this.ngZone.run(() => this.cdr.detectChanges());
    } catch (error) {
      console.error('Error deleting feeding record:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete feeding record.' });
    }
  }

  // ==============================
  // SAVE (add or update) — PURCHASE
  // ==============================

  async savePurchase() {
    if (!this.userId) return;
    this.saving = true;

    const totalCost = this.purchaseForm.quantityKg * this.purchaseForm.pricePerKg;
    const data: FeedPurchase = {
      userId: this.userId,
      feedType: this.purchaseForm.feedType,
      quantityKg: Number(this.purchaseForm.quantityKg),
      pricePerKg: Number(this.purchaseForm.pricePerKg),
      totalCost: totalCost,
      supplier: this.purchaseForm.supplier,
      purchaseDate: this.purchaseForm.purchaseDate
    };

    try {
      if (this.editingPurchaseId) {
        await this.dataService.updateFeedPurchase(this.editingPurchaseId, data);
        await Swal.fire({
          icon: 'success',
          title: 'Purchase Updated',
          text: 'Feed stock has been updated successfully.',
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        await this.dataService.addFeedPurchase(data);
        await Swal.fire({
          icon: 'success',
          title: 'Purchase Saved',
          text: 'Feed stock has been added successfully.',
          timer: 1800,
          showConfirmButton: false
        });
      }
      this.closePurchaseForm();
    } catch (error) {
      console.error('Error saving purchase:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save purchase.' });
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  // ==============================
  // SAVE (add or update) — FEEDING
  // ==============================

  async saveFeeding() {
    if (!this.userId) return;
    this.saving = true;

    const data: FeedRecord = {
      userId: this.userId,
      flockId: this.feedingForm.flockId,
      flockName: this.feedingForm.flockName,
      birdsCount: Number(this.feedingForm.birdsCount),
      feedType: this.feedingForm.feedType,
      quantityKg: Number(this.feedingForm.quantityKg),
      feedingDate: this.feedingForm.feedingDate
    };

    try {
      if (this.editingFeedingId) {
        await this.dataService.updateFeedRecord(this.editingFeedingId, data);
        await Swal.fire({
          icon: 'success',
          title: 'Feeding Updated',
          text: 'Feeding record has been updated successfully.',
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        await this.dataService.addFeedRecord(data);
        await Swal.fire({
          icon: 'success',
          title: 'Feeding Recorded',
          text: 'Daily feeding has been saved successfully.',
          timer: 1800,
          showConfirmButton: false
        });
      }
      this.closeFeedingForm();
    } catch (error) {
      console.error('Error saving feeding:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save feeding record.' });
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.flockSubscription?.unsubscribe();
    this.purchaseSubscription?.unsubscribe();
    this.feedingSubscription?.unsubscribe();
  }
}