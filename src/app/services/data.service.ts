import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  docData,
  orderBy
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import {
  Sale,
  Stock,
  Expense,
  DebtorPayment,
  UserProfile,
  Flock,
  HealthRecord
} from '../models/model';

// ==========================================
// FEED MANAGEMENT INTERFACES
// ==========================================

export interface FeedPurchase {
  id?: string;
  userId: string;
  feedType: string;
  quantityKg: number;
  pricePerKg: number;
  totalCost: number;
  supplier: string;
  purchaseDate: string;
  notes?: string;
  createdAt?: any;
}

export interface FeedRecord {
  id?: string;
  userId: string;
  flockId: string;
  flockName: string;
  feedType: string;
  birdsCount: number;
  quantityKg: number;
  feedingDate: string;
  notes?: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private firestore = inject(Firestore);

  // ==========================================
  // SALES
  // ==========================================

  getSales(userId: string): Observable<Sale[]> {

    const q = query(
      collection(this.firestore, 'sales'),
      where('userId', '==', userId),
      orderBy('saleDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<Sale[]>;
  }

  async addSale(sale: Sale) {

    return addDoc(
      collection(this.firestore, 'sales'),
      {
        ...sale,
        createdAt: serverTimestamp()
      }
    );
  }

  async updateSale(
    saleId: string,
    data: Partial<Sale>
  ) {

    const docRef = doc(
      this.firestore,
      `sales/${saleId}`
    );

    return updateDoc(docRef, data);
  }

  async deleteSale(saleId: string) {

    const docRef = doc(
      this.firestore,
      `sales/${saleId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // STOCKS (EGG PRODUCTION)
  // ==========================================

  getStocks(userId: string): Observable<Stock[]> {

    const q = query(
      collection(this.firestore, 'stocks'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<Stock[]>;
  }

  async addStock(stock: Stock) {

    return addDoc(
      collection(this.firestore, 'stocks'),
      {
        ...stock,
        createdAt: serverTimestamp()
      }
    );
  }

  async updateStock(
    stockId: string,
    data: Partial<Stock>
  ) {

    const docRef = doc(
      this.firestore,
      `stocks/${stockId}`
    );

    return updateDoc(docRef, data);
  }

  async deleteStock(stockId: string) {

    const docRef = doc(
      this.firestore,
      `stocks/${stockId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  getExpenses(userId: string): Observable<Expense[]> {

    const q = query(
      collection(this.firestore, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<Expense[]>;
  }

  async addExpense(expense: Expense) {

    return addDoc(
      collection(this.firestore, 'expenses'),
      {
        ...expense,
        createdAt: serverTimestamp()
      }
    );
  }

  async updateExpense(
    expenseId: string,
    data: Partial<Expense>
  ) {

    const docRef = doc(
      this.firestore,
      `expenses/${expenseId}`
    );

    return updateDoc(docRef, data);
  }

  async deleteExpense(expenseId: string) {

    const docRef = doc(
      this.firestore,
      `expenses/${expenseId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // DEBTOR PAYMENTS
  // ==========================================

  getPayments(userId: string): Observable<DebtorPayment[]> {

    const q = query(
      collection(this.firestore, 'payments'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<DebtorPayment[]>;
  }

  async addPayment(payment: DebtorPayment) {

    return addDoc(
      collection(this.firestore, 'payments'),
      {
        ...payment,
        createdAt: serverTimestamp()
      }
    );
  }

  async deletePayment(paymentId: string) {

    const docRef = doc(
      this.firestore,
      `payments/${paymentId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // USER PROFILE
  // ==========================================

  getUserProfile(uid: string): Observable<UserProfile> {

    const userRef = doc(
      this.firestore,
      `users/${uid}`
    );

    return docData(userRef, {
      idField: 'uid'
    }) as Observable<UserProfile>;
  }

  async updateUserProfile(
    uid: string,
    data: Partial<UserProfile>
  ) {

    return updateDoc(
      doc(this.firestore, `users/${uid}`),
      {
        ...data,
        updatedAt: serverTimestamp()
      }
    );
  }

  // ==========================================
  // FLOCK MANAGEMENT
  // ==========================================

  getFlocks(userId: string): Observable<Flock[]> {

    const q = query(
      collection(this.firestore, 'flocks'),
      where('userId', '==', userId)
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<Flock[]>;
  }

  async addFlock(flock: Flock) {

    const flockData = {
      ...flock,
      birds: Number(flock.birds) || 0,
      userId: flock.userId,
      createdAt: serverTimestamp()
    };

    return addDoc(
      collection(this.firestore, 'flocks'),
      flockData
    );
  }

  async updateFlock(
    flockId: string,
    data: Partial<Flock>
  ) {

    const docRef = doc(
      this.firestore,
      `flocks/${flockId}`
    );

    const updatedData: any = {
      ...data
    };

    if (data.birds !== undefined) {
      updatedData.birds = Number(data.birds) || 0;
    }

    return updateDoc(docRef, updatedData);
  }

  async deleteFlock(flockId: string) {

    const docRef = doc(
      this.firestore,
      `flocks/${flockId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // FEED PURCHASE MANAGEMENT
  // ==========================================

  getFeedPurchases(
    userId: string
  ): Observable<FeedPurchase[]> {

    const q = query(
      collection(this.firestore, 'feedPurchases'),
      where('userId', '==', userId),
      orderBy('purchaseDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<FeedPurchase[]>;
  }

  async addFeedPurchase(
    purchase: FeedPurchase
  ) {

    const quantity = Number(purchase.quantityKg);
    const price = Number(purchase.pricePerKg);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(price) ||
      quantity <= 0 ||
      price <= 0
    ) {
      throw new Error('Invalid feed purchase quantity or price.');
    }

    const purchaseData = {
      ...purchase,
      quantityKg: quantity,
      pricePerKg: price,
      totalCost: quantity * price,
      createdAt: serverTimestamp()
    };

    return addDoc(
      collection(this.firestore, 'feedPurchases'),
      purchaseData
    );
  }

  async updateFeedPurchase(
    purchaseId: string,
    data: Partial<FeedPurchase>
  ) {

    const docRef = doc(
      this.firestore,
      `feedPurchases/${purchaseId}`
    );

    const updatedData: any = {
      ...data
    };

    if (data.quantityKg !== undefined) {
      updatedData.quantityKg = Number(data.quantityKg);
    }

    if (data.pricePerKg !== undefined) {
      updatedData.pricePerKg = Number(data.pricePerKg);
    }

    if (
      updatedData.quantityKg !== undefined ||
      updatedData.pricePerKg !== undefined
    ) {
      const quantity = Number(
        updatedData.quantityKg ?? data.quantityKg
      );

      const price = Number(
        updatedData.pricePerKg ?? data.pricePerKg
      );

      if (
        !Number.isFinite(quantity) ||
        !Number.isFinite(price) ||
        quantity <= 0 ||
        price <= 0
      ) {
        throw new Error('Invalid feed purchase details.');
      }

      updatedData.totalCost = quantity * price;
    }

    return updateDoc(docRef, updatedData);
  }

  async deleteFeedPurchase(purchaseId: string) {

    const docRef = doc(
      this.firestore,
      `feedPurchases/${purchaseId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // FEED CONSUMPTION MANAGEMENT
  // ==========================================

  getFeedRecords(
    userId: string
  ): Observable<FeedRecord[]> {

    const q = query(
      collection(this.firestore, 'feedRecords'),
      where('userId', '==', userId),
      orderBy('feedingDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<FeedRecord[]>;
  }

  async addFeedRecord(
    record: FeedRecord
  ) {

    const quantity = Number(record.quantityKg);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new Error('Invalid feed consumption quantity.');
    }

    const recordData = {
      ...record,
      quantityKg: quantity,
      birdsCount: Number(record.birdsCount) || 0,
      createdAt: serverTimestamp()
    };

    return addDoc(
      collection(this.firestore, 'feedRecords'),
      recordData
    );
  }

  async updateFeedRecord(
    recordId: string,
    data: Partial<FeedRecord>
  ) {

    const docRef = doc(
      this.firestore,
      `feedRecords/${recordId}`
    );

    const updatedData: any = {
      ...data
    };

    if (data.quantityKg !== undefined) {

      const quantity = Number(data.quantityKg);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error('Invalid feeding quantity.');
      }

      updatedData.quantityKg = quantity;
    }

    if (data.birdsCount !== undefined) {
      updatedData.birdsCount = Number(data.birdsCount) || 0;
    }

    return updateDoc(docRef, updatedData);
  }

  async deleteFeedRecord(recordId: string) {

    const docRef = doc(
      this.firestore,
      `feedRecords/${recordId}`
    );

    return deleteDoc(docRef);
  }



  // ==========================================
  // HEALTH RECORDS MANAGEMENT
  // ==========================================

  getHealthRecords(
    userId: string
  ): Observable<HealthRecord[]> {

    const q = query(
      collection(this.firestore, 'healthRecords'),
      where('userId', '==', userId),
      orderBy('recordDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<HealthRecord[]>;
  }

  // ==========================================
  // ADD HEALTH RECORD
  // ==========================================

  async addHealthRecord(
    record: HealthRecord
  ) {

    if (!record.userId || !record.flockId) {
      throw new Error('User ID and flock ID are required.');
    }

    if (!record.recordDate) {
      throw new Error('Health record date is required.');
    }

    const recordData = {

      ...record,

      affectedBirds: Number(record.affectedBirds) || 0,

      recoveredBirds: Number(record.recoveredBirds) || 0,

      deadBirds: Number(record.deadBirds) || 0,

      vaccinatedBirds: Number(record.vaccinatedBirds) || 0,

      treatmentCost: Number(record.treatmentCost) || 0,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp()

    };

    return addDoc(
      collection(this.firestore, 'healthRecords'),
      recordData
    );
  }

  // ==========================================
  // UPDATE HEALTH RECORD
  // ==========================================

  async updateHealthRecord(
    recordId: string,
    data: Partial<HealthRecord>
  ) {

    const docRef = doc(
      this.firestore,
      `healthRecords/${recordId}`
    );

    const updatedData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };

    delete updatedData.id;
    delete updatedData.createdAt;

    const numericFields = [
      'affectedBirds',
      'recoveredBirds',
      'deadBirds',
      'vaccinatedBirds',
      'treatmentCost'
    ];

    numericFields.forEach(field => {

      if (updatedData[field] !== undefined) {

        updatedData[field] =
          Number(updatedData[field]) || 0;

      }

    });

    return updateDoc(docRef, updatedData);
  }

  // ==========================================
  // DELETE HEALTH RECORD
  // ==========================================

  async deleteHealthRecord(
    recordId: string
  ) {

    const docRef = doc(
      this.firestore,
      `healthRecords/${recordId}`
    );

    return deleteDoc(docRef);
  }

  // ==========================================
  // GET HEALTH RECORD BY FLOCK
  // ==========================================

  getHealthRecordsByFlock(
    userId: string,
    flockId: string
  ): Observable<HealthRecord[]> {

    const q = query(
      collection(this.firestore, 'healthRecords'),

      where('userId', '==', userId),

      where('flockId', '==', flockId),

      orderBy('recordDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<HealthRecord[]>;
  }

  // ==========================================
  // GET VACCINATION RECORDS
  // ==========================================

  getVaccinationRecords(
    userId: string
  ): Observable<HealthRecord[]> {

    const q = query(
      collection(this.firestore, 'healthRecords'),

      where('userId', '==', userId),

      where('recordType', '==', 'vaccination'),

      orderBy('recordDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<HealthRecord[]>;
  }

  // ==========================================
  // GET TREATMENT RECORDS
  // ==========================================

  getTreatmentRecords(
    userId: string
  ): Observable<HealthRecord[]> {

    const q = query(
      collection(this.firestore, 'healthRecords'),

      where('userId', '==', userId),

      where('recordType', '==', 'treatment'),

      orderBy('recordDate', 'desc')
    );

    return collectionData(q, {
      idField: 'id'
    }) as Observable<HealthRecord[]>;
  }

}