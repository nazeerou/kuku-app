import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Sale, DebtorPayment } from '../../models/model';
import { map, Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-debtors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 3. Added schema to fix ion-icon error
  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn"><ion-icon name="arrow-back-outline"></ion-icon></a>
      Debtors
    </div>
    <div class="page-container">
      <form [formGroup]="paymentForm" (ngSubmit)="recordPayment()">
        <h3 style="margin-bottom: 10px; color: #7047F5;">Record Payment</h3>
        <div class="form-group">
          <label>Select Customer</label>
          <select formControlName="customerName">
            <option *ngFor="let c of debtors$ | async" [value]="c.customerName">{{ c.customerName }} (Owes: {{ c.totalBalance | currency }})</option>
          </select>
        </div>
        <div class="form-group"><label>Amount Paid</label><input type="number" formControlName="amountPaid" /></div>
        <div class="form-group"><label>Date</label><input type="date" formControlName="date" /></div>
        <button type="submit" class="btn-primary" [disabled]="paymentForm.invalid">Record Payment</button>
      </form>

      <div class="data-list">
        <h3 style="color: #7047F5; margin-top: 20px;">Outstanding Balances</h3>
        <div class="list-card" *ngFor="let d of debtors$ | async">
          <h3>{{ d.customerName }}</h3>
          <p>Total Credit Sales: {{ d.totalSales | currency }}</p>
          <p>Total Paid: {{ d.totalPaid | currency }}</p>
          <p>Balance: <strong style="color: #dc3545;">{{ d.totalBalance | currency }}</strong></p>
        </div>
      </div>
    </div>
  `
})
export class DebtorsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  paymentForm!: FormGroup;
  debtors$!: Observable<any[]>;
  userId = '';

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadDebtors(user.uid);
      }
    });

    this.paymentForm = this.fb.group({
      customerName: ['', Validators.required],
      amountPaid: [0, Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadDebtors(uid: string) {
    const sales$ = this.dataService.getSales(uid);
    const payments$ = this.dataService.getPayments(uid);

    this.debtors$ = combineLatest([sales$, payments$]).pipe(
      map(([sales, payments]) => {
        const debtMap = new Map<string, any>();
        
        sales.filter(s => s.balance > 0).forEach(s => {
          if (!debtMap.has(s.customerName)) {
            debtMap.set(s.customerName, { customerName: s.customerName, totalSales: 0, totalPaid: 0, totalBalance: 0 });
          }
          const d = debtMap.get(s.customerName);
          d.totalSales += s.totalAmount;
          d.totalBalance += s.balance;
        });

        payments.forEach(p => {
          if (debtMap.has(p.customerName)) {
            debtMap.get(p.customerName).totalPaid += p.amountPaid;
            debtMap.get(p.customerName).totalBalance -= p.amountPaid;
          }
        });

        return Array.from(debtMap.values());
      })
    );
  }

  async recordPayment() {
    if (this.paymentForm.invalid) return;
    await this.dataService.addPayment({
      ...this.paymentForm.value,
      userId: this.userId
    });
    this.paymentForm.reset({ date: new Date().toISOString().split('T')[0], amountPaid: 0 });
  }
}