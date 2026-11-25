
import { Injectable, inject } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';

import { DataService } from '../services/data.service';

import {
  ReportData,
  ReportDateRange,
  BusinessReportSummary,
  FeedCostSummary
} from './../models/report.model';

import {
  Sale,
  Stock,
  Expense
} from '../models/model';

import {
  FeedPurchase,
  FeedRecord
} from '../services/data.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private dataService = inject(DataService);

  // ==========================================
  // LOAD ALL BUSINESS DATA
  // ==========================================

  getReportData(userId: string): Observable<ReportData> {

    return combineLatest({

      sales: this.dataService.getSales(userId),

      stocks: this.dataService.getStocks(userId),

      expenses: this.dataService.getExpenses(userId),

      feedPurchases:
        this.dataService.getFeedPurchases(userId),

      feedRecords:
        this.dataService.getFeedRecords(userId),

      flocks: this.dataService.getFlocks(userId)

    });
  }

  // ==========================================
  // FILTER DATA BY DATE
  // ==========================================

  filterByDate<T>(
    records: T[],
    dateField: keyof T,
    range: ReportDateRange
  ): T[] {

    return records.filter(record => {

      const date = String(record[dateField] || '');

      return (
        date >= range.startDate &&
        date <= range.endDate
      );

    });
  }

  // ==========================================
  // FEED COST ANALYSIS
  // ==========================================

  calculateFeedCosts(
    purchases: FeedPurchase[],
    records: FeedRecord[]
  ): FeedCostSummary[] {

    const feedTypes = new Set([
      ...purchases.map(p => p.feedType),
      ...records.map(r => r.feedType)
    ]);

    return Array.from(feedTypes).map(feedType => {

      const feedPurchases = purchases.filter(
        p => p.feedType === feedType
      );

      const feedConsumption = records.filter(
        r => r.feedType === feedType
      );

      const purchasedKg = feedPurchases.reduce(
        (sum, p) => sum + this.number(p.quantityKg),
        0
      );

      const purchaseCost = feedPurchases.reduce(
        (sum, p) => sum + this.number(p.totalCost),
        0
      );

      const consumedKg = feedConsumption.reduce(
        (sum, r) => sum + this.number(r.quantityKg),
        0
      );

      const averagePricePerKg =
        purchasedKg > 0
          ? purchaseCost / purchasedKg
          : 0;

      return {

        feedType,

        purchasedKg,

        consumedKg,

        averagePricePerKg,

        consumedCost:
          consumedKg * averagePricePerKg

      };

    });
  }

  // ==========================================
  // BUSINESS REPORT SUMMARY
  // ==========================================

  calculateSummary(
    data: ReportData,
    range: ReportDateRange
  ): BusinessReportSummary {

    const sales = this.filterByDate(
      data.sales,
      'saleDate',
      range
    );

    const stocks = this.filterByDate(
      data.stocks,
      'date',
      range
    );

    const expenses = this.filterByDate(
      data.expenses,
      'date',
      range
    );

    const feedRecords = this.filterByDate(
      data.feedRecords,
      'feedingDate',
      range
    );

    // Use all available purchase history to calculate
    // weighted average feed prices by feed type.
    const feedCosts = this.calculateFeedCosts(
      data.feedPurchases,
      feedRecords
    );

    const totalRevenue = sales.reduce(
      (sum, sale) =>
        sum + this.number(sale.totalAmount),
      0
    );

    const amountCollected = sales.reduce(
      (sum, sale) =>
        sum + this.number(sale.amountPaid),
      0
    );

    const outstandingBalance = sales.reduce(
      (sum, sale) =>
        sum + this.number(sale.balance),
      0
    );

    const feedCost = feedCosts.reduce(
      (sum, feed) => sum + feed.consumedCost,
      0
    );

    // Feed is calculated separately, so exclude feed
    // purchase expenses here to avoid double counting.
    const otherExpenses = expenses
      .filter(expense =>
        !this.isFeedExpense(expense)
      )
      .reduce(
        (sum, expense) =>
          sum + this.number(expense.amount),
        0
      );

    const totalExpenses = feedCost + otherExpenses;

    const totalEggs = stocks.reduce(
      (sum, stock) =>
        sum +
        (this.number(stock.trays) * 30) +
        this.number(stock.eggs),
      0
    );

    const brokenEggs = stocks.reduce(
      (sum, stock) =>
        sum + this.number(stock.brokenEggs),
      0
    );

    const netEggs = Math.max(
      0,
      totalEggs - brokenEggs
    );

    const feedPurchasedKg = data.feedPurchases
      .filter(purchase =>
        purchase.purchaseDate >= range.startDate &&
        purchase.purchaseDate <= range.endDate
      )
      .reduce(
        (sum, purchase) =>
          sum + this.number(purchase.quantityKg),
        0
      );

    const feedConsumedKg = feedRecords.reduce(
      (sum, record) =>
        sum + this.number(record.quantityKg),
      0
    );

    return {

      totalRevenue,

      amountCollected,

      outstandingBalance,

      totalExpenses,

      feedCost,

      otherExpenses,

      netProfit: totalRevenue - totalExpenses,

      totalEggs,

      brokenEggs,

      netEggs,

      totalTrays: totalEggs / 30,

      totalSales: sales.length,

      feedPurchasedKg,

      feedConsumedKg

    };
  }

  // ==========================================
  // SALES REPORT
  // ==========================================

  getSalesByProduct(sales: Sale[]) {

    const grouped = new Map<string, {
      product: string;
      quantity: number;
      revenue: number;
    }>();

    sales.forEach(sale => {

      const product = sale.product || 'Other';

      const current = grouped.get(product) || {
        product,
        quantity: 0,
        revenue: 0
      };

      current.quantity += this.number(sale.quantity);
      current.revenue += this.number(sale.totalAmount);

      grouped.set(product, current);

    });

    return Array.from(grouped.values());
  }

  // ==========================================
  // EXPENSES BY CATEGORY
  // ==========================================

  getExpensesByCategory(expenses: Expense[]) {

    const grouped = new Map<string, number>();

    expenses
      .filter(expense => !this.isFeedExpense(expense))
      .forEach(expense => {

        const category = expense.category || 'Other';

        grouped.set(
          category,
          (grouped.get(category) || 0) +
          this.number(expense.amount)
        );

      });

    return Array.from(grouped.entries()).map(
      ([category, amount]) => ({
        category,
        amount
      })
    );
  }

  // ==========================================
  // FEED PURCHASE EXPENSE DETECTION
  // ==========================================

  private isFeedExpense(expense: Expense): boolean {

    const category = (
      expense.category || ''
    ).toLowerCase().trim();

    return [
      'feed',
      'feeds',
      'chakula',
      'chicken feed',
      'poultry feed',
      'animal feed'
    ].some(keyword =>
      category === keyword
    );
  }

  // ==========================================
  // NUMBER VALIDATION
  // ==========================================

  private number(value: any): number {

    const result = Number(value);

    return Number.isFinite(result) ? result : 0;
  }
}
