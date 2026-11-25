import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] },
  { path: 'manage-flock', loadComponent: () => import('./pages/flock-management/flock-management.component').then(m => m.FlockManagementComponent), canActivate: [authGuard] },
 { path: 'manage-feed', loadComponent: () => import('./pages/feed-management/feed-management.component').then(m => m.FeedManagementComponent), canActivate: [authGuard] },
  { path: 'manage-health', loadComponent: () => import('./pages/health-records/health-records.component').then(m => m.HealthRecords), canActivate: [authGuard] },
  { path: 'sales', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent), canActivate: [authGuard] },
  { path: 'stocks', loadComponent: () => import('./pages/stocks/stocks.component').then(m => m.StocksComponent), canActivate: [authGuard] },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent), canActivate: [authGuard] },
  { path: 'stock-report', loadComponent: () => import('./pages/reports/stock-report.component').then(m => m.StockReportComponent), canActivate: [authGuard] },
  { path: 'expenses', loadComponent: () => import('./pages/expenses/expenses.component').then(m => m.ExpensesComponent), canActivate: [authGuard] },
  { path: 'expenses-report', loadComponent: () => import('./pages/reports/expenses-report.component').then(m => m.ExpensesReportComponent), canActivate: [authGuard] },
  { path: 'debtors', loadComponent: () => import('./pages/debtors/debtors.component').then(m => m.DebtorsComponent), canActivate: [authGuard] },
  { path: 'my-profile', loadComponent: () => import('./pages/my-profile/my-profile.component').then(m => m.MyProfileComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];