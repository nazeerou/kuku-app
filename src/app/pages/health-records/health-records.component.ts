
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

import {
  Flock,
  HealthRecord,
  HealthRecordType,
  HealthStatus
} from '../../models/model';

import Swal from 'sweetalert2';

interface FlockImpact {
  birds: number;
  layingHens: number;
}

@Component({
  selector: 'app-health-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="health-page">

      <header class="top-header">
        <div class="header-left">
          <a routerLink="/home" class="back-btn">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </a>
          <h2>Health Records</h2>
        </div>
      </header>

      <main class="content">

        <div class="alert success" *ngIf="successMessage">
          {{ successMessage }}
          <button type="button" (click)="successMessage = ''">×</button>
        </div>

        <div class="alert danger" *ngIf="errorMessage">
          {{ errorMessage }}
          <button type="button" (click)="errorMessage = ''">×</button>
        </div>

        <!-- DASHBOARD -->
        <section class="summary-grid">

          <div class="summary-card">
            <div class="summary-icon green-icon">
              <ion-icon name="document-text-outline"></ion-icon>
            </div>
            <span>Total Records</span>
            <h2>{{ totalRecords }}</h2>
            <small>All health activities</small>
          </div>

          <div class="summary-card">
            <div class="summary-icon red-icon">
              <ion-icon name="heart-outline"></ion-icon>
            </div>
            <span>Sick Birds</span>
            <h2>{{ totalSickBirds }}</h2>
            <small>Recorded as sick</small>
          </div>

          <div class="summary-card">
            <div class="summary-icon orange-icon">
              <ion-icon name="medkit-outline"></ion-icon>
            </div>
            <span>Under Treatment</span>
            <h2>{{ totalBirdsUnderTreatment }}</h2>
            <small>Receiving medication</small>
          </div>

          <div class="summary-card">
            <div class="summary-icon blue-icon">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
            </div>
            <span>Vaccinated</span>
            <h2>{{ totalVaccinatedBirds }}</h2>
            <small>Vaccinations recorded</small>
          </div>

          <div class="summary-card">
            <div class="summary-icon red-icon">
              <ion-icon name="warning-outline"></ion-icon>
            </div>
            <span>Mortality</span>
            <h2>{{ totalDeaths }}</h2>
            <small>Recorded deaths</small>
          </div>

          <div class="summary-card">
            <div class="summary-icon green-icon">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
            </div>
            <span>Recovered</span>
            <h2>{{ totalRecoveredBirds }}</h2>
            <small>Successfully treated</small>
          </div>

        </section>

        <!-- QUICK ACTIONS -->
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3>Quick Actions</h3>
              <p>Record poultry health activities</p>
            </div>
          </div>

          <div class="action-grid">

            <button type="button" class="action-card"
                    (click)="openAddForm('health')">
              <div class="action-icon red-icon">
                <ion-icon name="heart-outline"></ion-icon>
              </div>
              <div>
                <strong>Health</strong>
                <small>Diseases & symptoms</small>
              </div>
            </button>

            <button type="button" class="action-card"
                    (click)="openAddForm('vaccination')">
              <div class="action-icon blue-icon">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
              </div>
              <div>
                <strong>Vaccination</strong>
                <small>Vaccine records</small>
              </div>
            </button>

            <button type="button" class="action-card"
                    (click)="openAddForm('treatment')">
              <div class="action-icon orange-icon">
                <ion-icon name="medkit-outline"></ion-icon>
              </div>
              <div>
                <strong>Treatment</strong>
                <small>Medicine records</small>
              </div>
            </button>

            <button type="button" class="action-card"
                    (click)="openAddForm('mortality')">
              <div class="action-icon red-icon">
                <ion-icon name="warning-outline"></ion-icon>
              </div>
              <div>
                <strong>Mortality</strong>
                <small>Bird deaths</small>
              </div>
            </button>

          </div>
        </section>

        <!-- UPCOMING VACCINATIONS -->
        <section class="panel" *ngIf="upcomingVaccinations.length">
          <div class="panel-header">
            <div>
              <h3>Upcoming Vaccinations</h3>
              <p>Scheduled vaccination activities</p>
            </div>
          </div>

          <div class="reminder-list">
            <div class="reminder-item"
                 *ngFor="let record of upcomingVaccinations">

              <div class="reminder-info">
                <div class="reminder-icon">
                  <ion-icon name="calendar-outline"></ion-icon>
                </div>

                <div>
                  <strong>{{ record.vaccineName }}</strong>
                  <small>{{ record.flockName }}</small>
                </div>
              </div>

              <span class="date-badge">
                {{ formatDate(record.nextVaccinationDate) }}
              </span>

            </div>
          </div>
        </section>

        <!-- OVERDUE VACCINATIONS -->
        <section class="panel overdue-panel" *ngIf="overdueVaccinations.length">
          <div class="panel-header">
            <div>
              <h3>Overdue Vaccinations</h3>
              <p>Vaccination dates that have passed</p>
            </div>
          </div>

          <div class="reminder-item"
               *ngFor="let record of overdueVaccinations">

            <div>
              <strong>{{ record.vaccineName }}</strong>
              <small>{{ record.flockName }}</small>
            </div>

            <span class="date-badge overdue">
              {{ formatDate(record.nextVaccinationDate) }}
            </span>

          </div>
        </section>

        <!-- HEALTH HISTORY -->
        <section class="panel">

          <div class="panel-header">
            <div>
              <h3>Health History</h3>
              <p>View and manage all health records</p>
            </div>

            <button type="button" class="icon-button"
                    (click)="openAddForm()">
              <ion-icon name="add-outline"></ion-icon>
            </button>
          </div>

          <nav class="tabs">
            <button
              type="button"
              *ngFor="let tab of tabs"
              [class.active]="activeTab === tab.value"
              (click)="setTab(tab.value)">

              {{ tab.label }}
              <span class="tab-count">
                {{ getTabCount(tab.value) }}
              </span>

            </button>
          </nav>

          <!-- FILTERS -->
          <div class="filters-mobile">

            <input
              type="search"
              [(ngModel)]="searchTerm"
              placeholder="Search flock, disease, vaccine..."
            >

            <div class="filter-row">

              <select [(ngModel)]="selectedFlock">
                <option value="all">All Flocks</option>
                <option *ngFor="let flock of flocks"
                        [value]="flock.id">
                  {{ flock.name }}
                </option>
              </select>

              <select [(ngModel)]="selectedStatus">
                <option value="all">All Status</option>
                <option value="sick">Sick</option>
                <option value="under-treatment">Under Treatment</option>
                <option value="recovered">Recovered</option>
                <option value="vaccinated">Vaccinated</option>
                <option value="monitoring">Monitoring</option>
                <option value="dead">Dead</option>
              </select>

            </div>

            <button type="button" class="reset-btn"
                    (click)="clearFilters()">
              Reset Filters
            </button>

          </div>

          <div class="loading" *ngIf="loading">
            <div class="loader"></div>
            <p>Inapakia taarifa...</p>
          </div>

          <!-- RECORDS -->
          <ng-container *ngIf="!loading">

            <div class="list-card-view"
                 *ngFor="let record of filteredRecords">

              <div class="list-header-row">
                <div class="flock-title">
                  <h4>{{ record.flockName }}</h4>
                  <span class="date-badge">
                    {{ formatDate(record.recordDate) }}
                  </span>
                </div>

                <span class="type-badge"
                      [ngClass]="record.recordType">
                  {{ getRecordTypeLabel(record.recordType) }}
                </span>
              </div>

              <div class="list-detail-row">
                <span>Details:</span>
                <strong>{{ getRecordDetails(record) }}</strong>
              </div>

              <div class="list-detail-row"
                   *ngIf="record.symptoms || record.notes">
                <span>Notes:</span>
                <span class="note-text">
                  {{ record.symptoms || record.notes }}
                </span>
              </div>

              <div class="list-detail-row">
                <span>Birds:</span>
                <strong>{{ getBirdCount(record) }}</strong>
              </div>

              <div class="list-detail-row"
                   *ngIf="record.recoveredBirds">
                <span>Recovered:</span>
                <strong>{{ record.recoveredBirds }}</strong>
              </div>

              <div class="list-detail-row">
                <span>Status:</span>
                <span class="status-badge"
                      [ngClass]="record.status">
                  {{ getStatusLabel(record.status) }}
                </span>
              </div>

              <div class="card-actions">
                <button type="button"
                        class="text-action-btn edit-btn"
                        (click)="editRecord(record)">
                  <ion-icon name="create-outline"></ion-icon>
                  Edit
                </button>

                <button type="button"
                        class="text-action-btn delete-btn"
                        (click)="deleteRecord(record)">
                  <ion-icon name="trash-outline"></ion-icon>
                  Delete
                </button>
              </div>

            </div>

          </ng-container>

          <div class="empty-state"
               *ngIf="!loading && filteredRecords.length === 0">

            <ion-icon name="heart-outline"></ion-icon>
            <h4>No Records Found</h4>
            <p>Add a health, vaccination, treatment or mortality record.</p>

            <button type="button"
                    class="btn btn-primary"
                    (click)="openAddForm()">
              Add First Record
            </button>

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

        <a routerLink="/manage-flock">
          <ion-icon name="egg-outline"></ion-icon>
          <span>Flock</span>
        </a>

        <a routerLink="/feed-management">
          <ion-icon name="leaf"></ion-icon>
          <span>Feed</span>
        </a>

        <a routerLink="/health-records" class="active">
          <ion-icon name="medkit"></ion-icon>
          <span>Afya</span>
        </a>

      </nav>

      <!-- ADD / EDIT MODAL -->
      <div class="modal-backdrop"
           *ngIf="showForm"
           (click)="closeForm()">

        <div class="modal-content"
             (click)="$event.stopPropagation()">

          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">HEALTH MANAGEMENT</span>
              <h2>{{ isEditing ? 'Update Record' : 'Add Record' }}</h2>
            </div>

            <button type="button"
                    class="close-button"
                    (click)="closeForm()">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>
          </div>

          <form #healthForm="ngForm"
                (ngSubmit)="saveRecord()">

            <div class="form-group">
              <label>Record Type *</label>

              <select name="recordType"
                      [(ngModel)]="form.recordType"
                      (ngModelChange)="onRecordTypeChange($event)"
                      required>
                <option value="health">Health / Disease</option>
                <option value="vaccination">Vaccination</option>
                <option value="treatment">Treatment</option>
                <option value="mortality">Mortality</option>
              </select>
            </div>

            <div class="form-row">

              <div class="form-group">
                <label>Flock *</label>

                <select name="flockId"
                        [(ngModel)]="form.flockId"
                        (ngModelChange)="onFlockChange()"
                        required>

                  <option value="">Select Flock</option>

                  <option *ngFor="let flock of flocks"
                          [value]="flock.id">
                    {{ flock.name }}
                  </option>

                </select>
              </div>

              <div class="form-group">
                <label>Record Date *</label>
                <input type="date"
                       name="recordDate"
                       [(ngModel)]="form.recordDate"
                       required>
              </div>

            </div>

            <!-- HEALTH -->
            <ng-container *ngIf="form.recordType === 'health'">

              <div class="form-row">

                <div class="form-group">
                  <label>Disease</label>
                  <input name="disease"
                         [(ngModel)]="form.disease"
                         placeholder="e.g. Newcastle">
                </div>

                <div class="form-group">
                  <label>Affected Birds</label>
                  <input type="number"
                         name="affectedBirds"
                         min="0"
                         [(ngModel)]="form.affectedBirds">
                </div>

              </div>

              <div class="form-group">
                <label>Symptoms</label>
                <textarea name="symptoms"
                          [(ngModel)]="form.symptoms"
                          rows="2"
                          placeholder="Describe symptoms..."></textarea>
              </div>

              <div class="form-group">
                <label>Diagnosis</label>
                <textarea name="diagnosis"
                          [(ngModel)]="form.diagnosis"
                          rows="2"></textarea>
              </div>

              <div class="form-group"
                   *ngIf="form.status === 'recovered'">
                <label>Recovered Birds</label>
                <input type="number"
                       name="recoveredBirds"
                       min="0"
                       [(ngModel)]="form.recoveredBirds">
              </div>

            </ng-container>

            <!-- VACCINATION -->
            <ng-container *ngIf="form.recordType === 'vaccination'">

              <div class="form-group">
                <label>Vaccine Name *</label>
                <input name="vaccineName"
                       [(ngModel)]="form.vaccineName"
                       placeholder="e.g. Newcastle vaccine"
                       required>
              </div>

              <div class="form-row">

                <div class="form-group">
                  <label>Vaccinated Birds *</label>
                  <input type="number"
                         name="vaccinatedBirds"
                         min="1"
                         [(ngModel)]="form.vaccinatedBirds"
                         required>
                </div>

                <div class="form-group">
                  <label>Next Vaccination Date</label>
                  <input type="date"
                         name="nextVaccinationDate"
                         [(ngModel)]="form.nextVaccinationDate">
                </div>

              </div>

              <div class="form-group">
                <label>Administered By</label>
                <input name="administeredBy"
                       [(ngModel)]="form.administeredBy">
              </div>

            </ng-container>

            <!-- TREATMENT -->
            <ng-container *ngIf="form.recordType === 'treatment'">

              <div class="form-row">

                <div class="form-group">
                  <label>Medicine Name *</label>
                  <input name="medicineName"
                         [(ngModel)]="form.medicineName"
                         placeholder="Medicine name"
                         required>
                </div>

                <div class="form-group">
                  <label>Dosage</label>
                  <input name="dosage"
                         [(ngModel)]="form.dosage"
                         placeholder="e.g. 1g per litre">
                </div>

              </div>

              <div class="form-row">

                <div class="form-group">
                  <label>Affected Birds</label>
                  <input type="number"
                         name="affectedBirds"
                         min="0"
                         [(ngModel)]="form.affectedBirds">
                </div>

                <div class="form-group">
                  <label>Recovered Birds</label>
                  <input type="number"
                         name="recoveredBirds"
                         min="0"
                         [(ngModel)]="form.recoveredBirds">
                </div>

              </div>

              <div class="form-row">

                <div class="form-group">
                  <label>Start Date</label>
                  <input type="date"
                         name="treatmentStartDate"
                         [(ngModel)]="form.treatmentStartDate">
                </div>

                <div class="form-group">
                  <label>End Date</label>
                  <input type="date"
                         name="treatmentEndDate"
                         [(ngModel)]="form.treatmentEndDate">
                </div>

              </div>

              <div class="form-row">

                <div class="form-group">
                  <label>Cost (TZS)</label>
                  <input type="number"
                         name="treatmentCost"
                         min="0"
                         [(ngModel)]="form.treatmentCost">
                </div>

                <div class="form-group">
                  <label>Administered By</label>
                  <input name="administeredBy"
                         [(ngModel)]="form.administeredBy">
                </div>

              </div>

            </ng-container>

            <!-- MORTALITY -->
            <ng-container *ngIf="form.recordType === 'mortality'">

              <div class="form-row">

                <div class="form-group">
                  <label>Dead Birds *</label>
                  <input type="number"
                         name="deadBirds"
                         min="1"
                         [(ngModel)]="form.deadBirds"
                         required>
                </div>

                <div class="form-group">
                  <label>Cause of Death</label>
                  <input name="causeOfDeath"
                         [(ngModel)]="form.causeOfDeath"
                         placeholder="Cause">
                </div>

              </div>

            </ng-container>

            <!-- COMMON FIELDS -->
            <div class="form-row">

              <div class="form-group">
                <label>Status *</label>

                <select name="status"
                        [(ngModel)]="form.status"
                        (ngModelChange)="onStatusChange($event)"
                        required>
                  <option value="monitoring">Monitoring</option>
                  <option value="sick">Sick</option>
                  <option value="under-treatment">Under Treatment</option>
                  <option value="recovered">Recovered</option>
                  <option value="vaccinated">Vaccinated</option>
                  <option value="dead">Dead</option>
                </select>
              </div>

              <div class="form-group">
                <label>Supplier / Source</label>
                <input name="supplier"
                       [(ngModel)]="form.supplier"
                       placeholder="Supplier">
              </div>

            </div>

            <div class="form-group">
              <label>Additional Notes</label>
              <textarea name="notes"
                        [(ngModel)]="form.notes"
                        rows="2"
                        placeholder="Additional information..."></textarea>
            </div>

            <div class="modal-actions">

              <button type="button"
                      class="btn btn-outline"
                      (click)="closeForm()">
                Cancel
              </button>

              <button type="submit"
                      class="btn btn-primary"
                      [disabled]="saving || !healthForm.valid">
                {{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Save') }}
              </button>

            </div>

          </form>
        </div>
      </div>

    </div>
  `,

  styles: [`
    :host{display:block;min-height:100vh;background:#f4f7fc;color:#14264d;font-family:'Segoe UI',Roboto,Arial,sans-serif}
    *{box-sizing:border-box}
    .health-page{min-height:100vh;padding-bottom:85px}
    .top-header{background:linear-gradient(135deg,#4b1d8f,#6a3bbd);color:#fff;padding:16px;border-radius:0 0 24px 24px;box-shadow:0 4px 10px #0002}
    .header-left{display:flex;align-items:center;gap:12px}
    .back-btn{color:#fff;font-size:24px;display:flex;text-decoration:none}
    .header-left h2{font-size:18px;margin:0;font-weight:700}
    .content{max-width:1000px;margin:auto;padding:20px 14px}
    .summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px}
    .summary-card,.panel{background:#fff;border-radius:16px;padding:15px;box-shadow:0 2px 8px #0001}
    .summary-card span{display:block;font-size:11px;color:#64748b;font-weight:600;margin-top:8px}
    .summary-card h2{margin:5px 0;font-size:21px;color:#1e293b}
    .summary-card small{font-size:10px;color:#94a3b8}
    .summary-icon,.action-icon,.reminder-icon{display:flex;align-items:center;justify-content:center;border-radius:10px;flex-shrink:0}
    .summary-icon{width:34px;height:34px;font-size:19px}
    .green-icon{background:#effbf4;color:#14944e}
    .blue-icon{background:#edf4ff;color:#1265e8}
    .orange-icon{background:#fff7ed;color:#ec9425}
    .red-icon{background:#fcebea;color:#dc3545}
    .panel{margin-bottom:16px}
    .panel-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
    .panel-header h3{margin:0 0 4px;font-size:15px;font-weight:800}
    .panel-header p{margin:0;font-size:11px;color:#64748b}
    .icon-button{background:#f0f4ff;border:0;color:#4b1d8f;width:35px;height:35px;border-radius:50%;font-size:20px;cursor:pointer}
    .action-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .action-card{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;cursor:pointer;text-align:left}
    .action-card:hover{border-color:#4b1d8f}
    .action-icon{width:36px;height:36px;font-size:20px}
    .action-card strong{display:block;font-size:12px;color:#1e293b}
    .action-card small{font-size:10px;color:#64748b}
    .reminder-list{display:flex;flex-direction:column;gap:8px}
    .reminder-item{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#f8fafc;padding:10px;border-radius:10px;border:1px solid #f1f5f9;margin-bottom:8px}
    .reminder-info{display:flex;align-items:center;gap:10px}
    .reminder-icon{width:32px;height:32px;background:#edf4ff;color:#1265e8;border-radius:50%;font-size:16px}
    .reminder-item strong{display:block;font-size:12px}
    .reminder-item small{font-size:10px;color:#64748b;display:block}
    .date-badge{background:#e2e8f0;color:#475569;font-size:10px;font-weight:600;padding:4px 8px;border-radius:10px;white-space:nowrap}
    .overdue{background:#fcebea;color:#c0392b}
    .tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:14px;scrollbar-width:none}
    .tabs::-webkit-scrollbar{display:none}
    .tabs button{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer}
    .tabs button.active{background:#4b1d8f;color:#fff;border-color:#4b1d8f}
    .tab-count{background:#0001;padding:2px 6px;border-radius:10px;font-size:10px}
    .tabs button.active .tab-count{background:#fff3}
    .filters-mobile{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
    .filter-row{display:flex;gap:10px}
    .filter-row select{flex:1;min-width:0}
    .filters-mobile input,.filters-mobile select{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;font-size:13px;outline:none}
    .reset-btn{padding:8px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;font-size:12px;color:#64748b;cursor:pointer}
    .list-card-view{background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid #f1f5f9}
    .list-header-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0}
    .flock-title{display:flex;flex-direction:column;gap:4px}
    .flock-title h4{margin:0;font-size:14px;color:#1e293b}
    .type-badge{padding:4px 8px;border-radius:8px;font-size:10px;font-weight:700;text-transform:capitalize;white-space:nowrap}
    .type-badge.health{background:#fcebea;color:#c0392b}
    .type-badge.vaccination{background:#e8f1ff;color:#1565c0}
    .type-badge.treatment{background:#fff2dc;color:#a65b00}
    .type-badge.mortality{background:#fce4e4;color:#7f1d1d}
    .list-detail-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#64748b;margin-bottom:6px}
    .list-detail-row strong{color:#1e293b;text-align:right}
    .note-text{max-width:60%;text-align:right;overflow:hidden;text-overflow:ellipsis}
    .status-badge{padding:4px 8px;border-radius:8px;font-size:10px;font-weight:700}
    .status-badge.sick,.status-badge.dead{background:#fcebea;color:#c0392b}
    .status-badge.under-treatment,.status-badge.monitoring{background:#fff2dc;color:#a65b00}
    .status-badge.recovered,.status-badge.vaccinated{background:#e6f5ed;color:#198754}
    .card-actions{display:flex;gap:15px;margin-top:10px;padding-top:8px;border-top:1px dashed #e2e8f0}
    .text-action-btn{background:transparent;border:0;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;padding:0}
    .text-action-btn ion-icon{font-size:16px}
    .edit-btn{color:#1265e8}
    .delete-btn{color:#c52222}
    .loading,.empty-state{text-align:center;padding:30px 20px;color:#64748b}
    .loader{border:4px solid #f3f3f3;border-top:4px solid #4b1d8f;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:0 auto 10px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty-state ion-icon{font-size:40px;color:#cbd5e1;margin-bottom:10px}
    .empty-state h4{margin:0 0 5px;font-size:14px;color:#334155}
    .empty-state p{margin:0 0 15px;font-size:12px}
    .alert{padding:12px;border-radius:8px;margin-bottom:15px;display:flex;justify-content:space-between;font-size:13px}
    .alert button{border:0;background:transparent;font-size:18px;cursor:pointer}
    .alert.success{background:#d1e7dd;color:#146c43}
    .alert.danger{background:#f8d7da;color:#842029}
    .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:20;background:#fff;border-top:1px solid #e1e7f0;display:flex;justify-content:space-around;padding:9px 3px 7px}
    .bottom-nav a{text-decoration:none;color:#64748b;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;font-weight:600}
    .bottom-nav ion-icon{font-size:24px}
    .bottom-nav a.active{color:#4b1d8f}
    .bottom-nav a.active ion-icon{border-bottom:3px solid #4b1d8f;padding-bottom:2px}
    .modal-backdrop{position:fixed;inset:0;z-index:100;background:#101d35aa;display:flex;justify-content:center;align-items:flex-end}
    .modal-content{width:100%;max-width:500px;max-height:90vh;overflow-y:auto;background:#fff;border-radius:24px 24px 0 0;padding:22px;animation:slideUp .3s ease-out}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
    .modal-eyebrow{font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:1px}
    .modal-header h2{margin:4px 0 0;font-size:20px;color:#1e293b}
    .close-button{background:transparent;border:0;color:#64748b;font-size:28px;cursor:pointer}
    .form-group{margin-bottom:15px}
    .form-group label{display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px}
    .form-group input,.form-group select,.form-group textarea{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;outline:none;background:#f8fafc}
    .form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:#4b1d8f;background:#fff}
    .form-row{display:flex;gap:12px}
    .form-row .form-group{flex:1;min-width:0}
    .modal-actions{display:flex;gap:10px;margin-top:20px}
    .modal-actions button{flex:1}
    .btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:0}
    .btn-primary{background:#4b1d8f;color:#fff}
    .btn-outline{background:#fff;color:#4b1d8f;border:1px solid #4b1d8f}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    @media(min-width:600px){.modal-backdrop{align-items:center;padding:15px}.modal-content{border-radius:20px}}
    @media(max-width:420px){.form-row{flex-direction:column;gap:0}.summary-card{padding:12px}.summary-card h2{font-size:18px}}
  `]
})
export class HealthRecords implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  private recordsSubscription?: Subscription;
  private flocksSubscription?: Subscription;

  userId = '';

  loading = true;
  saving = false;

  showForm = false;
  isEditing = false;
  editingRecordId = '';

  successMessage = '';
  errorMessage = '';

  records: HealthRecord[] = [];
  flocks: Flock[] = [];

  activeTab: HealthRecordType | 'all' = 'all';

  searchTerm = '';
  selectedFlock = 'all';
  selectedStatus: HealthStatus | 'all' = 'all';

  form: HealthRecord = this.getEmptyForm();

  tabs: { label: string; value: HealthRecordType | 'all' }[] = [
    { label: 'All Records', value: 'all' },
    { label: 'Health', value: 'health' },
    { label: 'Vaccination', value: 'vaccination' },
    { label: 'Treatment', value: 'treatment' },
    { label: 'Mortality', value: 'mortality' }
  ];

  // INITIALIZATION

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {

        this.ngZone.run(() => {

          this.recordsSubscription?.unsubscribe();
          this.flocksSubscription?.unsubscribe();

          if (!user) {
            this.userId = '';
            this.records = [];
            this.flocks = [];
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          this.userId = user.uid;
          this.loading = true;

          this.loadFlocks();
          this.loadRecords();
        });

      });
  }

  ngOnDestroy(): void {
    this.recordsSubscription?.unsubscribe();
    this.flocksSubscription?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // DATE HELPERS

  getToday(): string {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
  }

  formatDate(date?: string): string {
    if (!date) return '-';

    const parsed = new Date(`${date}T00:00:00`);

    if (isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // EMPTY FORM

  getEmptyForm(): HealthRecord {
    return {
      userId: '',
      flockId: '',
      flockName: '',
      recordType: 'health',
      recordDate: this.getToday(),

      disease: '',
      symptoms: '',
      diagnosis: '',

      vaccineName: '',
      vaccinatedBirds: 0,
      nextVaccinationDate: '',

      medicineName: '',
      dosage: '',
      treatmentStartDate: '',
      treatmentEndDate: '',

      affectedBirds: 0,
      recoveredBirds: 0,
      deadBirds: 0,

      causeOfDeath: '',
      treatmentCost: 0,

      supplier: '',
      administeredBy: '',

      status: 'monitoring',
      notes: ''
    };
  }

  // LOAD FLOCKS

  loadFlocks(): void {
    if (!this.userId) return;

    this.flocksSubscription?.unsubscribe();

    this.flocksSubscription = this.dataService
      .getFlocks(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: flocks => {
          this.ngZone.run(() => {
            this.flocks = flocks || [];
            this.cdr.detectChanges();
          });
        },

        error: error => {
          console.error('Error loading flocks:', error);

          this.ngZone.run(() => {
            this.errorMessage = 'Imeshindwa kupakia taarifa za flock.';
            this.cdr.detectChanges();
          });
        }

      });
  }

  // LOAD HEALTH RECORDS

  loadRecords(): void {
    if (!this.userId) {
      this.records = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.recordsSubscription?.unsubscribe();

    this.recordsSubscription = this.dataService
      .getHealthRecords(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: records => {
          this.ngZone.run(() => {

            this.records = (records || []).sort((a, b) =>
              (b.recordDate || '').localeCompare(a.recordDate || '')
            );

            this.loading = false;
            this.cdr.detectChanges();
          });
        },

        error: error => {
          console.error('Error loading health records:', error);

          this.ngZone.run(() => {
            this.errorMessage = 'Imeshindwa kupakia taarifa za afya.';
            this.loading = false;
            this.cdr.detectChanges();
          });
        }

      });
  }

  // FLOCK SELECTION

  getSelectedFlock(): Flock | undefined {
    return this.flocks.find(
      flock => flock.id === this.form.flockId
    );
  }

  onFlockChange(): void {
    const flock = this.getSelectedFlock();
    this.form.flockName = flock?.name || '';
  }

  // RECORD TYPE AND STATUS

  onRecordTypeChange(type: HealthRecordType): void {
    const defaults: Record<HealthRecordType, HealthStatus> = {
      health: 'sick',
      vaccination: 'vaccinated',
      treatment: 'under-treatment',
      mortality: 'dead'
    };

    this.form.status = defaults[type];

    if (type !== 'health' && type !== 'treatment') {
      this.form.affectedBirds = 0;
      this.form.recoveredBirds = 0;
    }

    if (type !== 'mortality') {
      this.form.deadBirds = 0;
    }
  }

  onStatusChange(status: HealthStatus): void {
    if (status !== 'recovered') {
      // Do not erase recovery information for treatment records.
      if (this.form.recordType === 'health') {
        this.form.recoveredBirds = 0;
      }
    }
  }

  // FORM ACTIONS

  openAddForm(type: HealthRecordType = 'health'): void {
    this.isEditing = false;
    this.editingRecordId = '';

    this.form = this.getEmptyForm();
    this.form.recordType = type;

    this.onRecordTypeChange(type);
    this.form.userId = this.userId;

    if (this.flocks.length > 0) {
      this.form.flockId = this.flocks[0].id || '';
      this.form.flockName = this.flocks[0].name || '';
    }

    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingRecordId = '';
  }

  editRecord(record: HealthRecord): void {
    this.isEditing = true;
    this.editingRecordId = record.id || '';

    this.form = {
      ...this.getEmptyForm(),
      ...record
    };

    this.showForm = true;
    this.clearMessages();
  }

  // FLOCK IMPACT CALCULATION
  //
  // Mortality:
  //   birds      -= deadBirds
  //   layingHens -= deadBirds
  //
  // Sick / treatment:
  //   layingHens -= affectedBirds - recoveredBirds
  //
  // Total birds are not reduced when birds are sick.
  //
  // A recovered bird is added back to laying hens by reducing
  // the net number of birds excluded from laying.

  private getRecordImpact(record?: HealthRecord): FlockImpact {
    if (!record) {
      return { birds: 0, layingHens: 0 };
    }

    if (record.recordType === 'mortality') {
      const dead = Math.max(0, Number(record.deadBirds || 0));

      return {
        birds: -dead,
        layingHens: -dead
      };
    }

    if (
      record.recordType === 'health' ||
      record.recordType === 'treatment'
    ) {
      const affected = Math.max(
        0,
        Number(record.affectedBirds || 0)
      );

      const recovered = Math.max(
        0,
        Number(record.recoveredBirds || 0)
      );

      if (
        record.status === 'sick' ||
        record.status === 'under-treatment' ||
        record.status === 'recovered'
      ) {
        return {
          birds: 0,
          layingHens: -(affected - recovered)
        };
      }
    }

    return { birds: 0, layingHens: 0 };
  }

  /**
   * Calculates the difference between the old and new records,
   * then updates the affected flock.
   *
   * Reversing the old record first prevents double subtraction
   * when a user edits an existing record.
   */
  private async applyFlockImpact(
    oldRecord?: HealthRecord,
    newRecord?: HealthRecord
  ): Promise<void> {

    const impacts = new Map<string, FlockImpact>();

    const addImpact = (
      flockId: string,
      impact: FlockImpact,
      multiplier: number
    ): void => {

      if (!flockId) return;

      const current = impacts.get(flockId) || {
        birds: 0,
        layingHens: 0
      };

      current.birds += impact.birds * multiplier;
      current.layingHens += impact.layingHens * multiplier;

      impacts.set(flockId, current);
    };

    // Reverse old record.
    if (oldRecord) {
      addImpact(
        oldRecord.flockId,
        this.getRecordImpact(oldRecord),
        -1
      );
    }

    // Apply new record.
    if (newRecord) {
      addImpact(
        newRecord.flockId,
        this.getRecordImpact(newRecord),
        1
      );
    }

    const updates: Array<{
      original: Flock;
      updated: Flock;
    }> = [];

    // Validate all affected flocks before updating any of them.
    for (const [flockId, impact] of impacts.entries()) {

      if (
        impact.birds === 0 &&
        impact.layingHens === 0
      ) {
        continue;
      }

      const flock = this.flocks.find(
        item => item.id === flockId
      );

      if (!flock || !flock.id) {
        throw new Error(`Flock not found: ${flockId}`);
      }

      const currentBirds = Number(flock.birds || 0);
      const currentLayers = Number(flock.layingHens || 0);

      const newBirds = currentBirds + impact.birds;
      const newLayers = currentLayers + impact.layingHens;

      if (newBirds < 0) {
        throw new Error(
          `Huwezi kupunguza kuku zaidi ya waliopo kwenye flock ${flock.name}.`
        );
      }

      if (newLayers < 0) {
        throw new Error(
          `Idadi ya kuku wanaotaga haiwezi kuwa chini ya sifuri kwenye flock ${flock.name}.`
        );
      }

      if (newLayers > newBirds) {
        throw new Error(
          `Kuku wanaotaga hawawezi kuzidi jumla ya kuku kwenye flock ${flock.name}.`
        );
      }

      const updated: Flock = {
        ...flock,
        birds: newBirds,
        layingHens: newLayers
      };

      updates.push({
        original: flock,
        updated
      });
    }

    // Save flock changes.
    const completed: typeof updates = [];

    try {
      for (const item of updates) {
        await this.dataService.updateFlock(
          item.updated.id!,
          item.updated
        );

        completed.push(item);

        // Update local data immediately.
        this.flocks = this.flocks.map(flock =>
          flock.id === item.updated.id
            ? item.updated
            : flock
        );
      }

    } catch (error) {
      // Best-effort rollback if a later flock update fails.
      for (const item of [...completed].reverse()) {
        try {
          await this.dataService.updateFlock(
            item.original.id!,
            item.original
          );
        } catch (rollbackError) {
          console.error('Flock rollback failed:', rollbackError);
        }
      }

      this.loadFlocks();
      throw error;
    }

    this.cdr.detectChanges();
  }

  // VALIDATION

  validateForm(): boolean {
    const type = this.form.recordType;

    if (!this.form.flockId || !this.form.recordDate) {
      this.errorMessage =
        'Tafadhali chagua flock na tarehe ya taarifa.';
      return false;
    }

    const flock = this.getSelectedFlock();

    if (!flock) {
      this.errorMessage = 'Flock uliyochagua haipatikani.';
      return false;
    }

    if (type === 'health') {
      if (
        !this.form.disease?.trim() &&
        !this.form.symptoms?.trim()
      ) {
        this.errorMessage =
          'Ingiza jina la ugonjwa au dalili.';
        return false;
      }
    }

    if (type === 'vaccination') {
      if (
        !this.form.vaccineName?.trim() ||
        Number(this.form.vaccinatedBirds) <= 0
      ) {
        this.errorMessage =
          'Ingiza jina la chanjo na idadi ya kuku waliochanjwa.';
        return false;
      }
    }

    if (type === 'treatment') {
      if (!this.form.medicineName?.trim()) {
        this.errorMessage =
          'Ingiza jina la dawa iliyotumika.';
        return false;
      }
    }

    if (type === 'mortality') {
      if (Number(this.form.deadBirds) <= 0) {
        this.errorMessage =
          'Ingiza idadi ya kuku waliokufa.';
        return false;
      }
    }

    const affected = Number(this.form.affectedBirds || 0);
    const recovered = Number(this.form.recoveredBirds || 0);
    const vaccinated = Number(this.form.vaccinatedBirds || 0);
    const dead = Number(this.form.deadBirds || 0);
    const cost = Number(this.form.treatmentCost || 0);

    const values = [
      affected,
      recovered,
      vaccinated,
      dead,
      cost
    ];

    if (
      values.some(value =>
        !Number.isFinite(value) || value < 0
      )
    ) {
      this.errorMessage =
        'Tafadhali ingiza namba sahihi. Idadi na gharama haziwezi kuwa chini ya sifuri.';
      return false;
    }

    if (recovered > affected) {
      this.errorMessage =
        'Kuku waliopona hawawezi kuzidi kuku walioathirika.';
      return false;
    }

    const flockBirds = Number(flock.birds || 0);

    if (
      affected > flockBirds ||
      recovered > flockBirds ||
      vaccinated > flockBirds ||
      dead > flockBirds
    ) {
      this.errorMessage =
        'Idadi ya kuku haiwezi kuzidi idadi ya kuku waliopo kwenye flock.';
      return false;
    }

    // Check projected flock numbers, accounting for the old
    // record when editing.
    const oldRecord = this.isEditing
      ? this.records.find(
          record => record.id === this.editingRecordId
        )
      : undefined;

    const oldImpact = this.getRecordImpact(oldRecord);
    const newImpact = this.getRecordImpact(this.form);

    const sameFlock =
      !!oldRecord &&
      oldRecord.flockId === this.form.flockId;

    let projectedBirds = flockBirds;
    let projectedLayers = Number(flock.layingHens || 0);

    if (sameFlock) {
      projectedBirds -= oldImpact.birds;
      projectedLayers -= oldImpact.layingHens;
    }

    projectedBirds += newImpact.birds;
    projectedLayers += newImpact.layingHens;

    if (projectedBirds < 0 || projectedLayers < 0) {
      this.errorMessage =
        'Idadi ya kuku haiwezi kuwa chini ya sifuri baada ya mabadiliko haya.';
      return false;
    }

    if (projectedLayers > projectedBirds) {
      this.errorMessage =
        'Kuku wanaotaga hawawezi kuzidi jumla ya kuku kwenye flock.';
      return false;
    }

    return true;
  }

  // SAVE RECORD

  async saveRecord(): Promise<void> {
    if (this.saving) return;

    if (!this.userId) {
      this.errorMessage = 'Tafadhali ingia kwanza.';
      return;
    }

    if (!this.validateForm()) return;

    this.saving = true;
    this.clearMessages();

    let oldRecord: HealthRecord | undefined;
    let newRecord: HealthRecord | undefined;
    let flockImpactApplied = false;

    try {
      const flock = this.getSelectedFlock();

      newRecord = {
        ...this.form,

        userId: this.userId,
        flockName: flock?.name || this.form.flockName,

        affectedBirds: Number(this.form.affectedBirds || 0),
        recoveredBirds: Number(this.form.recoveredBirds || 0),
        deadBirds: Number(this.form.deadBirds || 0),
        vaccinatedBirds: Number(this.form.vaccinatedBirds || 0),
        treatmentCost: Number(this.form.treatmentCost || 0)
      };

      delete newRecord.id;
      delete newRecord.createdAt;
      delete newRecord.updatedAt;

      if (this.isEditing && this.editingRecordId) {

        oldRecord = this.records.find(
          record => record.id === this.editingRecordId
        );

        if (!oldRecord) {
          throw new Error(
            'Taarifa ya zamani haijapatikana.'
          );
        }

        // First update flock numbers.
        await this.applyFlockImpact(oldRecord, newRecord);
        flockImpactApplied = true;

        try {
          await this.dataService.updateHealthRecord(
            this.editingRecordId,
            newRecord
          );
        } catch (recordError) {
          // Restore the previous flock values if saving the
          // health record fails.
          await this.applyFlockImpact(newRecord, oldRecord);
          flockImpactApplied = false;
          throw recordError;
        }

        this.successMessage =
          'Taarifa zimesasishwa na idadi ya kuku kwenye flock imebadilishwa!';

      } else {

        // First update flock numbers.
        await this.applyFlockImpact(undefined, newRecord);
        flockImpactApplied = true;

        try {
          await this.dataService.addHealthRecord(newRecord);
        } catch (recordError) {
          // Restore the flock if saving the new record fails.
          await this.applyFlockImpact(newRecord, undefined);
          flockImpactApplied = false;
          throw recordError;
        }

        this.successMessage =
          'Taarifa mpya zimehifadhiwa na idadi ya kuku kwenye flock imebadilishwa!';
      }

      this.closeForm();
      this.loadFlocks();
      this.loadRecords();

    } catch (error: any) {
      console.error('Error saving health record:', error);

      this.errorMessage =
        error?.message ||
        'Imeshindwa kuhifadhi taarifa. Jaribu tena.';

      // If this flag remains true, the record save may have
      // succeeded but a later operation failed. Refresh data.
      if (flockImpactApplied) {
        this.loadFlocks();
        this.loadRecords();
      }

    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  // DELETE RECORD

  async deleteRecord(record: HealthRecord): Promise<void> {
    if (!record.id || this.saving) return;

    const result = await Swal.fire({
      title: 'Futa Taarifa?',
      text: `Una uhakika unataka kufuta taarifa ya ${record.flockName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c52222',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ndio, Futa',
      cancelButtonText: 'Ghairi'
    });

    if (!result.isConfirmed) return;

    this.saving = true;
    this.clearMessages();

    let flockRestored = false;

    try {
      // Reverse the record's effect before deleting it.
      await this.applyFlockImpact(record, undefined);
      flockRestored = true;

      try {
        await this.dataService.deleteHealthRecord(record.id);
      } catch (deleteError) {
        // Reapply the record impact if deletion fails.
        await this.applyFlockImpact(undefined, record);
        flockRestored = false;
        throw deleteError;
      }

      this.successMessage =
        'Taarifa imefutwa na idadi ya kuku kwenye flock imerejeshwa!';

      this.loadFlocks();
      this.loadRecords();

    } catch (error: any) {
      console.error('Error deleting health record:', error);

      this.errorMessage =
        error?.message || 'Imeshindwa kufuta taarifa.';

      if (flockRestored) {
        this.loadFlocks();
        this.loadRecords();
      }

    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  // DASHBOARD STATISTICS

  get totalRecords(): number {
    return this.records.length;
  }

  get totalSickBirds(): number {
    return this.records
      .filter(record =>
        record.recordType === 'health' &&
        record.status === 'sick'
      )
      .reduce((sum, record) =>
        sum + Number(record.affectedBirds || 0), 0
      );
  }

  get totalBirdsUnderTreatment(): number {
    return this.records
      .filter(record =>
        record.status === 'under-treatment'
      )
      .reduce((sum, record) =>
        sum + Math.max(
          0,
          Number(record.affectedBirds || 0) -
          Number(record.recoveredBirds || 0)
        ), 0
      );
  }

  get totalVaccinatedBirds(): number {
    return this.records
      .filter(record =>
        record.recordType === 'vaccination'
      )
      .reduce((sum, record) =>
        sum + Number(record.vaccinatedBirds || 0), 0
      );
  }

  get totalDeaths(): number {
    return this.records
      .filter(record =>
        record.recordType === 'mortality'
      )
      .reduce((sum, record) =>
        sum + Number(record.deadBirds || 0), 0
      );
  }

  get totalRecoveredBirds(): number {
    return this.records
      .filter(record =>
        record.recordType === 'treatment' ||
        record.recordType === 'health'
      )
      .reduce((sum, record) =>
        sum + Number(record.recoveredBirds || 0), 0
      );
  }

  get totalTreatmentCost(): number {
    return this.records
      .filter(record =>
        record.recordType === 'treatment'
      )
      .reduce((sum, record) =>
        sum + Number(record.treatmentCost || 0), 0
      );
  }

  // VACCINATION REMINDERS

  get upcomingVaccinations(): HealthRecord[] {
    const today = this.getToday();

    return this.records
      .filter(record =>
        record.recordType === 'vaccination' &&
        !!record.nextVaccinationDate &&
        record.nextVaccinationDate >= today
      )
      .sort((a, b) =>
        (a.nextVaccinationDate || '')
          .localeCompare(b.nextVaccinationDate || '')
      )
      .slice(0, 3);
  }

  get overdueVaccinations(): HealthRecord[] {
    const today = this.getToday();

    return this.records
      .filter(record =>
        record.recordType === 'vaccination' &&
        !!record.nextVaccinationDate &&
        record.nextVaccinationDate < today
      )
      .sort((a, b) =>
        (a.nextVaccinationDate || '')
          .localeCompare(b.nextVaccinationDate || '')
      );
  }

  // FILTER RECORDS

  get filteredRecords(): HealthRecord[] {
    const search = this.searchTerm.toLowerCase().trim();

    return this.records.filter(record => {

      const matchesTab =
        this.activeTab === 'all' ||
        record.recordType === this.activeTab;

      const matchesFlock =
        this.selectedFlock === 'all' ||
        record.flockId === this.selectedFlock;

      const matchesStatus =
        this.selectedStatus === 'all' ||
        record.status === this.selectedStatus;

      const searchableValues: string[] = [
        record.flockName || '',
        record.disease || '',
        record.vaccineName || '',
        record.medicineName || '',
        record.symptoms || '',
        record.diagnosis || '',
        record.causeOfDeath || '',
        record.notes || ''
      ];

      const matchesSearch =
        !search ||
        searchableValues.some(value =>
          value.toLowerCase().includes(search)
        );

      return (
        matchesTab &&
        matchesFlock &&
        matchesStatus &&
        matchesSearch
      );
    });
  }

  getTabCount(tab: HealthRecordType | 'all'): number {
    if (tab === 'all') {
      return this.records.length;
    }

    return this.records.filter(
      record => record.recordType === tab
    ).length;
  }

  setTab(tab: HealthRecordType | 'all'): void {
    this.activeTab = tab;
  }

  clearFilters(): void {
    this.activeTab = 'all';
    this.selectedFlock = 'all';
    this.selectedStatus = 'all';
    this.searchTerm = '';
  }

  // DISPLAY HELPERS

  getRecordDetails(record: HealthRecord): string {
    switch (record.recordType) {

      case 'health':
        return record.disease || record.symptoms || 'Health issue';

      case 'vaccination':
        return record.vaccineName || 'Vaccination';

      case 'treatment':
        return record.medicineName || 'Treatment';

      case 'mortality':
        return record.causeOfDeath || 'Mortality';

      default:
        return 'Health record';
    }
  }

  getBirdCount(record: HealthRecord): number {
    switch (record.recordType) {

      case 'health':
      case 'treatment':
        return Number(record.affectedBirds || 0);

      case 'vaccination':
        return Number(record.vaccinatedBirds || 0);

      case 'mortality':
        return Number(record.deadBirds || 0);

      default:
        return 0;
    }
  }

  getRecordTypeLabel(type: HealthRecordType): string {
    const labels: Record<HealthRecordType, string> = {
      health: 'Health',
      vaccination: 'Vaccination',
      treatment: 'Treatment',
      mortality: 'Mortality'
    };

    return labels[type];
  }

  getStatusLabel(status: HealthStatus): string {
    const labels: Record<HealthStatus, string> = {
      sick: 'Sick',
      'under-treatment': 'Under Treatment',
      recovered: 'Recovered',
      vaccinated: 'Vaccinated',
      dead: 'Dead',
      monitoring: 'Monitoring'
    };

    return labels[status];
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
