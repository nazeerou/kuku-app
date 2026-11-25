
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth, authState } from '@angular/fire/auth';
import { DataService } from '../../services/data.service';

import {
  Flock,
  Stock,
  HealthRecord
} from '../../models/model';

import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-flock-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="flock-page">

      <header class="top-header">
        <div class="header-left">
          <a routerLink="/home" class="back-btn">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </a>

          <div class="brand">
            <h2>Flock Management</h2>
          </div>
        </div>
      </header>

      <main class="content">

        <!-- HERO BANNER -->
        <section class="hero-banner">
          <img src="/images/chicks.png" alt="Hen and chicks">

          <div class="hero-text">
            <div class="hero-birds">🐓 🐓 🐓</div>
            <h2>Dhibiti Makundi Yako</h2>
            <p>ya Kuku kwa Urahisi</p>
          </div>
        </section>

        <!-- STATISTICS -->
        <section class="stats-grid">

          <div class="stat-card blue-card">
            <ion-icon name="egg-outline"></ion-icon>
            <h2>{{ flocks.length }}</h2>
            <p>Flocks</p>
          </div>

          <div class="stat-card purple-card">
            <ion-icon name="paw-outline"></ion-icon>
            <h2>{{ totalBirds | number }}</h2>
            <p>Total Birds</p>
          </div>

          <div class="stat-card orange-card">
            <ion-icon name="basket-outline"></ion-icon>
            <h2>{{ totalTraysToday | number:'1.0-1' }}</h2>
            <p>Trays Today</p>
          </div>

          <div class="stat-card green-card">
            <ion-icon name="trending-up-outline"></ion-icon>
            <h2>{{ overallPerformance | number:'1.1-1' }}%</h2>
            <p>Egg Performance</p>
          </div>

        </section>

        <!-- ADD FLOCK AND FARM FILTER -->
        <section class="action-row">

          <button class="add-flock-btn" (click)="openAddForm()">
            <ion-icon name="add-circle"></ion-icon>
            Add Flock
          </button>

          <select class="farm-select" [(ngModel)]="selectedFarm">
            <option value="All Farms">All Farms</option>
            <option value="Main Farm">Main Farm Bagamoyo</option>
            <option value="Secondary Farm">Mkanyageni Farm</option>
          </select>

        </section>

        <!-- FLOCK LIST -->
        <section class="flock-list">

          <div class="flock-card"
               *ngFor="let flock of filteredFlocks">

            <img
              class="flock-image"
              [src]="flock.image"
              alt="Flock">

            <div class="flock-details">

              <h3>{{ flock.name }}</h3>

              <p>
                <ion-icon name="home-outline"></ion-icon>
                {{ flock.farm }}
              </p>

              <p>
                <ion-icon name="paw-outline"></ion-icon>
                {{ flock.birds | number }} Birds | {{ flock.age }}
              </p>

              <p>
                <ion-icon name="egg-outline"></ion-icon>
                {{ flock.layingHens | number }} Laying Hens
              </p>

              <p>
                <ion-icon name="calendar-outline"></ion-icon>
                Started: {{ flock.started }}
              </p>

              <p>
                <ion-icon name="basket-outline"></ion-icon>
                Trays Today:
                <strong>
                  {{ getFlockTraysToday(flock) | number:'1.0-1' }}
                </strong>
              </p>

              <div class="edit-delete-row">

                <button
                  class="text-action-btn edit-btn"
                  (click)="editFlock(flock)">

                  <ion-icon name="create-outline"></ion-icon>
                  Edit
                </button>

                <button
                  class="text-action-btn delete-btn"
                  (click)="deleteFlock(flock)">

                  <ion-icon name="trash-outline"></ion-icon>
                  Delete
                </button>

              </div>

            </div>

            <div class="flock-status">

              <span
                class="status"
                [ngClass]="flock.status.toLowerCase().replace(' ', '-')">

                <ion-icon
                  [name]="flock.status === 'Active'
                    ? 'checkmark-circle'
                    : flock.status === 'On Hold'
                    ? 'pause-circle'
                    : 'close-circle'">
                </ion-icon>

                {{ flock.status }}

              </span>

              <div
                class="metric"
                [ngClass]="flock.status.toLowerCase().replace(' ', '-')">

                Performance

                <strong>
                  {{ getFlockPerformance(flock) | number:'1.1-1' }}%
                </strong>

              </div>

            </div>

            <button class="view-btn" (click)="viewFlock(flock)">
              <ion-icon name="chevron-forward"></ion-icon>
            </button>

          </div>

          <div class="empty-state" *ngIf="filteredFlocks.length === 0">

            <ion-icon name="egg-outline"></ion-icon>
            <h3>No Flocks Found</h3>
            <p>Add a new flock to get started.</p>

          </div>

        </section>

        <!-- FLOCK OVERVIEW -->
        <section class="overview">

          <h3>
            <ion-icon name="bar-chart-outline"></ion-icon>
            Flock Overview
          </h3>

          <div class="overview-grid">

            <div>
              <ion-icon name="paw-outline"></ion-icon>
              <h2>{{ totalBirds | number }}</h2>
              <p>Total Birds</p>
            </div>

            <div>
              <ion-icon name="basket-outline"></ion-icon>
              <h2>{{ totalTraysToday | number:'1.0-1' }}</h2>
              <p>Trays Today</p>
            </div>

            <div>
              <ion-icon name="heart-outline"></ion-icon>
              <h2>{{ healthRate | number:'1.1-1' }}%</h2>
              <p>Health Rate</p>
            </div>

          </div>

          <!-- HEALTH PERFORMANCE -->
          <div class="health-section">

            <div class="health-heading">
              <h3>Chicken Health Performance</h3>

              <span class="health-percentage">
                {{ healthRate | number:'1.1-1' }}%
              </span>
            </div>

            <div class="health-progress">
              <div
                class="health-progress-fill"
                [style.width.%]="healthRate">
              </div>
            </div>

            <div class="health-summary">

              <div>
                <span class="healthy-dot"></span>
                Healthy Birds:
                <strong>{{ healthyBirds | number }}</strong>
              </div>

              <div>
                <span class="sick-dot"></span>
                Sick Birds:
                <strong>{{ sickBirds | number }}</strong>
              </div>

            </div>

            <p class="health-note">
              Calculated from your current flock population and active
              illness records.
            </p>

          </div>

          <!-- EGG PRODUCTION -->
          <h3 class="section-subtitle">
            <ion-icon name="analytics-outline"></ion-icon>
            Egg Production Performance
          </h3>

          <div class="overview-grid">

            <div>
              <ion-icon name="egg-outline"></ion-icon>
              <h2>{{ totalLayingHens | number }}</h2>
              <p>Laying Hens</p>
            </div>

            <div>
              <ion-icon name="basket-outline"></ion-icon>
              <h2>{{ totalTraysToday | number:'1.0-1' }}</h2>
              <p>Trays Today</p>
            </div>

            <div>
              <ion-icon name="trending-up-outline"></ion-icon>
              <h2>{{ overallPerformance | number:'1.1-1' }}%</h2>
              <p>Average HDP</p>
            </div>

          </div>

        </section>

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

        <a class="active" routerLink="/flock-management">
          <ion-icon name="egg"></ion-icon>
          <span>Flock</span>
        </a>

        <a routerLink="/notifications">
          <ion-icon name="notifications-outline"></ion-icon>
          <span>Arifa</span>
        </a>

        <a routerLink="/my-profile">
          <ion-icon name="settings-outline"></ion-icon>
          <span>Mipangilio</span>
        </a>

      </nav>

      <!-- ADD / EDIT FLOCK MODAL -->
      <div
        class="modal-overlay"
        *ngIf="showAddForm"
        (click)="closeAddForm()">

        <div class="add-modal" (click)="$event.stopPropagation()">

          <div class="modal-header">

            <h2>
              {{ editingFlock ? 'Edit Flock' : 'Add New Flock' }}
            </h2>

            <button type="button" (click)="closeAddForm()">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>

          </div>

          <form (ngSubmit)="addFlock()">

            <label>Flock Name</label>

            <input
              type="text"
              name="name"
              [(ngModel)]="newFlock.name"
              placeholder="e.g. Layer Flock A3"
              required>

            <label>Farm Location</label>

            <select name="farm" [(ngModel)]="newFlock.farm">
              <option value="Main Farm">Main Farm</option>
              <option value="Secondary Farm">Secondary Farm</option>
            </select>

            <label>Number of Birds</label>

            <input
              type="number"
              name="birds"
              [(ngModel)]="newFlock.birds"
              placeholder="Enter number of birds"
              min="1"
              required>

            <label>Number of Laying Hens</label>

            <input
              type="number"
              name="layingHens"
              [(ngModel)]="newFlock.layingHens"
              placeholder="Enter number of laying hens"
              min="0"
              required>

            <label>Bird Age</label>

            <input
              type="text"
              name="age"
              [(ngModel)]="newFlock.age"
              placeholder="e.g. 20 Days"
              required>

            <label>Start Date</label>

            <input
              type="date"
              name="started"
              [(ngModel)]="newFlock.started"
              required>

            <label>Flock Type</label>

            <select name="type" [(ngModel)]="newFlock.type">
              <option value="Layer">Layer</option>
              <option value="Broiler">Broiler</option>
              <option value="Kienyeji">Kienyeji</option>
            </select>

            <button class="save-btn" type="submit" [disabled]="loading">

              <ion-icon name="save-outline"></ion-icon>

              {{ editingFlock ? 'Update Flock' : 'Save Flock' }}

            </button>

          </form>

        </div>
      </div>

      <!-- FLOCK DETAILS -->
      <div
        class="modal-overlay"
        *ngIf="selectedFlock"
        (click)="selectedFlock = null">

        <div
          class="add-modal details-modal"
          (click)="$event.stopPropagation()">

          <div class="modal-header">

            <h2>Flock Details</h2>

            <button type="button" (click)="selectedFlock = null">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>

          </div>

          <img
            class="detail-image"
            [src]="selectedFlock.image"
            alt="Flock">

          <h2>{{ selectedFlock.name }}</h2>

          <p>Farm: {{ selectedFlock.farm }}</p>
          <p>Birds: {{ selectedFlock.birds | number }}</p>
          <p>Laying Hens: {{ selectedFlock.layingHens | number }}</p>
          <p>Age: {{ selectedFlock.age }}</p>
          <p>Started: {{ selectedFlock.started }}</p>
          <p>Status: {{ selectedFlock.status }}</p>

          <p>
            Trays Today:
            {{ getFlockTraysToday(selectedFlock) | number:'1.0-1' }}
          </p>

          <p>
            Production Performance:
            {{ getFlockPerformance(selectedFlock) | number:'1.1-1' }}%
          </p>

          <p>
            Sick Birds:
            {{ getFlockSickBirds(selectedFlock) | number }}
          </p>

          <p>
            Health Rate:
            {{ getFlockHealthRate(selectedFlock) | number:'1.1-1' }}%
          </p>

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

    .flock-page { min-height: 100vh; padding-bottom: 85px; }

    .top-header {
      background: linear-gradient(135deg, #4b1d8f, #6a3bbd);
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 10px #00000019;
    }

    .header-left { display: flex; align-items: center; gap: 12px; }
    .back-btn { color: white; font-size: 24px; display: flex; text-decoration: none; }
    .brand h2 { font-size: 18px; margin: 0; font-weight: 700; }

    .content { max-width: 1000px; margin: auto; padding: 20px 14px; }

    .hero-banner {
      height: 165px;
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      background: #d9e8ff;
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .hero-banner img { width: 58%; height: 100%; object-fit: cover; }
    .hero-text { flex: 1; text-align: center; padding: 8px; color: #4b1d8f; }
    .hero-birds { font-size: 35px; }
    .hero-text h2 { font-size: clamp(15px, 2vw, 23px); margin: 5px 0; font-weight: 800; }
    .hero-text p { margin: 0; font-size: 14px; font-weight: 600; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }

    .stat-card {
      min-width: 0;
      background: white;
      border: 1px solid #dce5f5;
      border-radius: 17px;
      padding: 13px 5px;
      text-align: center;
    }

    .stat-card ion-icon { font-size: 37px; }
    .stat-card h2 { margin: 5px 0; font-size: clamp(17px, 3vw, 27px); font-weight: 800; }
    .stat-card p { margin: 0; font-size: 12px; font-weight: 600; }

    .blue-card { color: #1265e8; background: #edf4ff; }
    .purple-card { color: #7047F5; background: #f0f4ff; }
    .orange-card { color: #ec9425; background: #fff7ed; }
    .green-card { color: #14944e; background: #effbf4; }

    .action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 20px 0 15px;
    }

    .add-flock-btn {
      background: #4b1d8f;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 13px;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 9px;
      cursor: pointer;
    }

    .add-flock-btn ion-icon { font-size: 25px; }

    .farm-select {
      border: none;
      border-radius: 13px;
      background: #e5efff;
      color: #174b9c;
      padding: 13px 10px;
      font-weight: 700;
      max-width: 48%;
    }

    .flock-list { display: flex; flex-direction: column; gap: 12px; }

    .flock-card {
      background: white;
      border: 1px solid #e2e8f2;
      box-shadow: 0 3px 9px #172d5010;
      border-radius: 19px;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .flock-image {
      width: 105px;
      height: 105px;
      border-radius: 14px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .flock-details { flex: 1; min-width: 0; }
    .flock-details h3 { font-size: 16px; margin: 0 0 7px; font-weight: 800; }

    .flock-details p {
      margin: 5px 0;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 7px;
      color: #27364e;
    }

    .flock-details ion-icon { color: #41618e; font-size: 16px; flex-shrink: 0; }

    .edit-delete-row {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #dce4f1;
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

    .text-action-btn ion-icon { font-size: 16px; }
    .edit-btn { color: #1265e8; }
    .delete-btn { color: #c52222; }

    .flock-status { width: 120px; flex-shrink: 0; text-align: center; }

    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px 10px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .status.active { background: #d7f8e0; color: #11853e; }
    .status.on-hold { background: #fff0c9; color: #a66a05; }
    .status.completed { background: #ffe0e0; color: #c52222; }
    .status ion-icon { font-size: 18px; }

    .metric {
      margin-top: 8px;
      padding: 9px 5px;
      border-radius: 13px;
      font-size: 11px;
      line-height: 1.5;
    }

    .metric strong { display: block; font-size: 17px; }
    .metric.active { background: #ddf8e5; color: #11763a; }
    .metric.on-hold { background: #fff0d0; color: #895b11; }
    .metric.completed { background: #ffe2e2; color: #a51d1d; }

    .view-btn {
      background: transparent;
      border: none;
      border-left: 1px solid #dce4f1;
      color: #7047F5;
      font-size: 25px;
      padding: 10px 0 10px 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .overview {
      margin-top: 17px;
      background: #eaf2ff;
      border: 1px solid #c8dcff;
      border-radius: 17px;
      padding: 14px;
    }

    .overview h3 {
      font-size: 17px;
      margin: 0 0 13px;
      display: flex;
      align-items: center;
      gap: 9px;
      color: #4b1d8f;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
    }

    .overview-grid > div { padding: 5px; border-right: 1px solid #b7cbe9; }
    .overview-grid > div:last-child { border: none; }
    .overview-grid ion-icon { font-size: 28px; color: #7047F5; }
    .overview-grid h2 { margin: 3px 0; font-size: 20px; }
    .overview-grid p { margin: 0; font-size: 12px; }

    .health-section {
      margin-top: 18px;
      background: white;
      padding: 15px;
      border-radius: 14px;
      border: 1px solid #dce5f5;
    }

    .health-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .health-heading h3 { margin: 0; font-size: 15px; color: #243b63; }
    .health-percentage { color: #168a48; font-weight: 800; font-size: 20px; }

    .health-progress {
      width: 100%;
      height: 12px;
      background: #e5eaf1;
      border-radius: 20px;
      overflow: hidden;
      margin: 13px 0;
    }

    .health-progress-fill {
      height: 100%;
      background: #20a45a;
      border-radius: 20px;
      transition: width .3s ease;
    }

    .health-summary {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
      color: #475569;
    }

    .healthy-dot, .sick-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      margin-right: 5px;
    }

    .healthy-dot { background: #20a45a; }
    .sick-dot { background: #e34d4d; }
    .health-note { margin: 10px 0 0; font-size: 11px; color: #64748b; }

    .section-subtitle { margin-top: 20px !important; }

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
    .bottom-nav .active { color: #4b1d8f; border-bottom: 3px solid #4b1d8f; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #101d35a8;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
      overflow-y: auto;
    }

    .add-modal {
      width: 100%;
      max-width: 460px;
      max-height: 90vh;
      overflow-y: auto;
      background: white;
      border-radius: 20px;
      padding: 22px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .modal-header h2 { margin: 0; font-size: 21px; }

    .modal-header button {
      border: none;
      background: transparent;
      color: #4b1d8f;
      font-size: 27px;
      cursor: pointer;
    }

    .add-modal label {
      display: block;
      margin: 13px 0 6px;
      font-size: 13px;
      font-weight: 700;
    }

    .add-modal input, .add-modal select {
      width: 100%;
      padding: 12px;
      border: 1px solid #d5deed;
      border-radius: 10px;
      outline: none;
      background: #f9fbff;
      font-size: 14px;
    }

    .add-modal input:focus, .add-modal select:focus { border-color: #4b1d8f; }

    .save-btn {
      width: 100%;
      margin-top: 22px;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: #4b1d8f;
      color: white;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .save-btn:disabled { opacity: .6; cursor: not-allowed; }

    .detail-image {
      width: 100%;
      height: 190px;
      object-fit: cover;
      border-radius: 13px;
    }

    .empty-state {
      text-align: center;
      padding: 30px;
      background: white;
      border-radius: 16px;
    }

    .empty-state ion-icon { font-size: 45px; color: #4b1d8f; }

    @media(max-width: 600px) {
      .content { padding: 10px; }
      .hero-banner { height: 145px; }
      .hero-banner img { width: 52%; }
      .stats-grid { gap: 6px; }
      .stat-card { padding: 10px 3px; border-radius: 12px; }
      .stat-card ion-icon { font-size: 27px; }
      .stat-card p { font-size: 10px; }
      .flock-card { gap: 7px; padding: 8px; }
      .flock-image { width: 75px; height: 90px; }
      .flock-details h3 { font-size: 13px; }
      .flock-details p { font-size: 10px; gap: 3px; }
      .flock-status { width: 88px; }
      .status { padding: 6px; font-size: 10px; }
      .metric { font-size: 10px; padding: 6px 3px; }
      .metric strong { font-size: 14px; }
      .view-btn { font-size: 20px; padding-left: 3px; }
      .edit-delete-row { gap: 10px; margin-top: 6px; padding-top: 6px; }
      .text-action-btn { font-size: 10px; gap: 2px; }
      .text-action-btn ion-icon { font-size: 13px; }
      .add-flock-btn { padding: 11px 13px; font-size: 14px; }
      .farm-select { font-size: 11px; }
    }

    @media(max-width: 360px) {
      .flock-image { width: 60px; height: 80px; }
      .flock-status { width: 76px; }
      .flock-details p { font-size: 9px; }
    }
  `]
})

export class FlockManagementComponent implements OnInit, OnDestroy {

  private authSubscription?: Subscription;
  private flockSubscription?: Subscription;
  private stockSubscription?: Subscription;
  private healthSubscription?: Subscription;

  private userId = '';

  showAddForm = false;
  selectedFarm = 'All Farms';

  selectedFlock: Flock | null = null;
  editingFlock: Flock | null = null;

  loading = false;

  flocks: Flock[] = [];
  stockEntries: Stock[] = [];
  healthRecords: HealthRecord[] = [];

  newFlock = {
    name: '',
    farm: 'Main Farm',
    birds: 0,
    layingHens: 0,
    age: '',
    started: '',
    type: 'Layer'
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
        this.stockSubscription?.unsubscribe();
        this.healthSubscription?.unsubscribe();

        if (!user) {
          this.userId = '';
          this.flocks = [];
          this.stockEntries = [];
          this.healthRecords = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.userId = user.uid;

        this.loadFlocks();
        this.loadStocks();
        this.loadHealthRecords();

      });

    });

  }

  // =====================================
  // LOAD FLOCKS
  // =====================================

  loadFlocks(): void {

    if (!this.userId) return;

    this.loading = true;
    this.flockSubscription?.unsubscribe();

    this.flockSubscription = this.dataService
      .getFlocks(this.userId)
      .subscribe({

        next: (records: Flock[]) => {

          this.ngZone.run(() => {

            this.flocks = (records || []).map(flock => {

              const type = flock.type || flock.metric || 'Layer';

              return {
                ...flock,
                birds: Number(flock.birds || 0),
                layingHens: Number(flock.layingHens || 0),
                age: flock.age || '',
                farm: flock.farm || 'Main Farm',
                started: flock.started || '',
                status: flock.status || 'Active',
                metricLabel: 'Performance',
                metric: '0.0%',
                image: flock.image || this.getFlockImage(type),
                type
              };

            });

            this.loading = false;
            this.cdr.detectChanges();

          });

        },

        error: error => {

          console.error('Error loading flocks:', error);

          this.ngZone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });

          Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Unable to load flock records. Please try again.'
          });

        }

      });

  }

  // =====================================
  // LOAD STOCKS
  // =====================================

  loadStocks(): void {

    if (!this.userId) return;

    this.stockSubscription?.unsubscribe();

    this.stockSubscription = this.dataService
      .getStocks(this.userId)
      .subscribe({

        next: (records: Stock[]) => {

          this.ngZone.run(() => {
            this.stockEntries = records || [];
            this.cdr.detectChanges();
          });

        },

        error: error => {
          console.error('Error loading egg production:', error);
        }

      });

  }

  // =====================================
  // LOAD HEALTH RECORDS FROM FIRESTORE
  // =====================================

  loadHealthRecords(): void {

    if (!this.userId) return;

    this.healthSubscription?.unsubscribe();

    this.healthSubscription = this.dataService
      .getHealthRecords(this.userId)
      .subscribe({

        next: (records: HealthRecord[]) => {

          this.ngZone.run(() => {
            this.healthRecords = records || [];
            this.cdr.detectChanges();
          });

        },

        error: error => {

          console.error('Error loading health records:', error);

          this.ngZone.run(() => {
            this.healthRecords = [];
            this.cdr.detectChanges();
          });

        }

      });

  }

  // =====================================
  // DATE HELPERS
  // =====================================

  private getTodayDate(): string {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  private getProductionDate(value: any): string {

    if (!value) return '';

    if (typeof value === 'string') {

      if (/^\\d{4}-\\d{2}-\\d{2}/.test(value)) {
        return value.substring(0, 10);
      }

      const parsed = new Date(value);

      return isNaN(parsed.getTime())
        ? ''
        : this.formatDateForComparison(parsed);

    }

    if (typeof value.toDate === 'function') {
      return this.formatDateForComparison(value.toDate());
    }

    if (value instanceof Date) {
      return this.formatDateForComparison(value);
    }

    return '';

  }

  private formatDateForComparison(date: Date): string {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  // =====================================
  // FLOCK EGGS TODAY
  // =====================================

  getFlockEggsToday(flock: Flock): number {

    if (!flock.id) return 0;

    const today = this.getTodayDate();

    return this.stockEntries

      .filter(stock =>
        this.getProductionDate(stock.date) === today
      )

      .reduce((total, stock) => {

        const production = (stock.flocks || []).find(
          item => item.flockId === flock.id
        );

        if (!production) return total;

        const trays = Number(production.trays) || 0;
        const looseEggs = Number(production.eggs) || 0;

        return total + (trays * 30) + looseEggs;

      }, 0);

  }

  getFlockTraysToday(flock: Flock): number {
    return this.getFlockEggsToday(flock) / 30;
  }

  // =====================================
  // FLOCK HDP
  // =====================================

  getFlockPerformance(flock: Flock): number {

    const layingHens = Number(flock.layingHens) || 0;

    if (layingHens <= 0) return 0;

    return (this.getFlockEggsToday(flock) / layingHens) * 100;

  }

  // =====================================
  // TOTAL BIRDS
  // =====================================

  get totalBirds(): number {

    return this.flocks
      .filter(flock => flock.status !== 'Completed')
      .reduce(
        (sum, flock) => sum + Math.max(0, Number(flock.birds) || 0),
        0
      );

  }

  // =====================================
  // SICK BIRDS PER FLOCK
  // =====================================

  getFlockSickBirds(flock: Flock): number {

    if (!flock.id || flock.status === 'Completed') return 0;

    const sick = this.healthRecords

      .filter(record =>
        record.flockId === flock.id &&
        record.recordType === 'health' &&
        (
          record.status === 'sick' ||
          record.status === 'under-treatment'
        )
      )

      .reduce((total, record) => {

        return total +
          Math.max(0, Number(record.affectedBirds || 0));

      }, 0);

    return Math.min(sick, Math.max(0, Number(flock.birds) || 0));

  }

  // =====================================
  // TOTAL SICK BIRDS
  // =====================================

  get sickBirds(): number {

    return this.flocks

      .filter(flock => flock.status !== 'Completed')

      .reduce(
        (total, flock) => total + this.getFlockSickBirds(flock),
        0
      );

  }

  // =====================================
  // HEALTHY BIRDS
  // =====================================

  get healthyBirds(): number {

    return Math.max(0, this.totalBirds - this.sickBirds);

  }

  // =====================================
  // HEALTH RATE PER FLOCK
  // =====================================

  getFlockHealthRate(flock: Flock): number {

    const birds = Math.max(0, Number(flock.birds) || 0);

    if (birds === 0 || flock.status === 'Completed') return 0;

    const sick = this.getFlockSickBirds(flock);

    return Math.max(0, Math.min(100, ((birds - sick) / birds) * 100));

  }

  // =====================================
  // OVERALL HEALTH RATE
  // =====================================

  get healthRate(): number {

    if (this.totalBirds <= 0) return 0;

    return Math.max(
      0,
      Math.min(100, (this.healthyBirds / this.totalBirds) * 100)
    );

  }

  // =====================================
  // TOTAL LAYING HENS
  // =====================================

  get totalLayingHens(): number {

    return this.flocks

      .filter(flock => flock.status === 'Active')

      .reduce(
        (sum, flock) => sum + Math.max(0, Number(flock.layingHens) || 0),
        0
      );

  }

  // =====================================
  // TOTAL EGGS TODAY
  // =====================================

  get totalEggsToday(): number {

    return this.flocks

      .filter(flock => flock.status === 'Active')

      .reduce(
        (sum, flock) => sum + this.getFlockEggsToday(flock),
        0
      );

  }

  get totalTraysToday(): number {
    return this.totalEggsToday / 30;
  }

  // =====================================
  // OVERALL HDP
  // =====================================

  get overallPerformance(): number {

    if (this.totalLayingHens <= 0) return 0;

    return (this.totalEggsToday / this.totalLayingHens) * 100;

  }

  // =====================================
  // FARM FILTER
  // =====================================

  get filteredFlocks(): Flock[] {

    if (this.selectedFarm === 'All Farms') {
      return this.flocks;
    }

    return this.flocks.filter(
      flock => flock.farm === this.selectedFarm
    );

  }

  // =====================================
  // FLOCK IMAGE
  // =====================================

  getFlockImage(type: string): string {

    switch (type) {
      case 'Layer':
      case 'Broiler':
      case 'Kienyeji':
      default:
        return '/images/chicks.png';
    }

  }

  // =====================================
  // DATE FORMATTING
  // =====================================

  formatDate(dateValue: string): string {

    if (!dateValue) return '';

    const date = new Date(dateValue + 'T00:00:00');

    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  }

  convertToInputDate(dateValue: string): string {

    if (!dateValue) return '';

    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    const parsedDate = new Date(dateValue);

    if (isNaN(parsedDate.getTime())) return '';

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }

  // =====================================
  // OPEN ADD FORM
  // =====================================

  openAddForm(): void {

    this.editingFlock = null;

    this.newFlock = {
      name: '',
      farm: 'Main Farm',
      birds: 0,
      layingHens: 0,
      age: '',
      started: '',
      type: 'Layer'
    };

    this.showAddForm = true;

  }

  closeAddForm(): void {
    this.showAddForm = false;
    this.editingFlock = null;
  }

  // =====================================
  // EDIT FLOCK
  // =====================================

  editFlock(flock: Flock): void {

    this.editingFlock = flock;

    this.newFlock = {
      name: flock.name,
      farm: flock.farm,
      birds: Number(flock.birds || 0),
      layingHens: Number(flock.layingHens || 0),
      age: flock.age,
      started: this.convertToInputDate(flock.started),
      type: flock.type || flock.metric || 'Layer'
    };

    this.showAddForm = true;

  }

  // =====================================
  // ADD / UPDATE FLOCK
  // =====================================

  async addFlock(): Promise<void> {

    if (this.loading) return;

    if (!this.userId) {

      await Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in before saving a flock.'
      });

      return;

    }

    if (
      !this.newFlock.name.trim() ||
      !this.newFlock.birds ||
      Number(this.newFlock.birds) < 1 ||
      !this.newFlock.age.trim() ||
      !this.newFlock.started
    ) {

      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required flock details.'
      });

      return;

    }

    const birds = Number(this.newFlock.birds);
    const layingHens = Number(this.newFlock.layingHens);

    if (
      !Number.isFinite(birds) ||
      !Number.isFinite(layingHens) ||
      birds < 1 ||
      layingHens < 0 ||
      layingHens > birds
    ) {

      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Number',
        text: 'Laying hens cannot exceed the total number of birds.'
      });

      return;

    }

    const flockType = this.newFlock.type;

    const flockData: Flock = {

      name: this.newFlock.name.trim(),
      farm: this.newFlock.farm,
      birds,
      layingHens,
      age: this.newFlock.age.trim(),
      started: this.formatDate(this.newFlock.started),
      type: flockType,
      status: this.editingFlock?.status || 'Active',
      metricLabel: 'Performance',
      metric: '0.0%',
      image: this.getFlockImage(flockType),
      userId: this.userId

    };

    this.loading = true;

    try {

      if (this.editingFlock) {

        if (!this.editingFlock.id) {
          throw new Error('Flock document ID is missing.');
        }

        await this.dataService.updateFlock(
          this.editingFlock.id,
          flockData
        );

        await Swal.fire({
          icon: 'success',
          title: 'Flock Updated',
          text: 'Flock details have been updated successfully.',
          timer: 1800,
          showConfirmButton: false
        });

      } else {

        await this.dataService.addFlock(flockData);

        await Swal.fire({
          icon: 'success',
          title: 'Flock Added',
          text: 'New flock has been saved successfully.',
          timer: 1800,
          showConfirmButton: false
        });

      }

      this.selectedFarm = 'All Farms';
      this.closeAddForm();

    } catch (error) {

      console.error('Error saving flock:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Unable to save flock details. Please try again.'
      });

    } finally {
      this.loading = false;
    }

  }

  // =====================================
  // DELETE FLOCK
  // =====================================

  async deleteFlock(flock: Flock): Promise<void> {

    if (!flock.id) {

      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'This flock has no Firestore document ID.'
      });

      return;

    }

    const result = await Swal.fire({

      title: 'Delete Flock?',
      text: `Je, una uhakika unataka kufuta kundi la "${flock.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c52222',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'

    });

    if (!result.isConfirmed) return;

    try {

      await this.dataService.deleteFlock(flock.id);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Flock has been deleted successfully.',
        timer: 1800,
        showConfirmButton: false
      });

      if (this.selectedFlock?.id === flock.id) {
        this.selectedFlock = null;
      }

    } catch (error) {

      console.error('Error deleting flock:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Unable to delete this flock. Please try again.'
      });

    }

  }

  viewFlock(flock: Flock): void {
    this.selectedFlock = flock;
  }

  // =====================================
  // CLEANUP
  // =====================================

  ngOnDestroy(): void {

    this.authSubscription?.unsubscribe();
    this.flockSubscription?.unsubscribe();
    this.stockSubscription?.unsubscribe();
    this.healthSubscription?.unsubscribe();

  }

}
