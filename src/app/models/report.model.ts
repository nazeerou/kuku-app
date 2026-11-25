
import { Sale, Stock, Expense, Flock } from './model';
import { FeedPurchase, FeedRecord } from '../services/data.service';

export type ReportPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'custom';

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export interface ReportData {
  sales: Sale[];
  stocks: Stock[];
  expenses: Expense[];
  feedPurchases: FeedPurchase[];
  feedRecords: FeedRecord[];
  flocks: Flock[];
}

export interface FeedCostSummary {
  feedType: string;
  purchasedKg: number;
  consumedKg: number;
  averagePricePerKg: number;
  consumedCost: number;
}

export interface BusinessReportSummary {
  totalRevenue: number;
  amountCollected: number;
  outstandingBalance: number;
  totalExpenses: number;
  feedCost: number;
  otherExpenses: number;
  netProfit: number;
  totalEggs: number;
  brokenEggs: number;
  netEggs: number;
  totalTrays: number;
  totalSales: number;
  feedPurchasedKg: number;
  feedConsumedKg: number;
}
