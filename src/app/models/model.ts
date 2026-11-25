
export interface Sale {
  id?: string;
  customerName: string;
  saleDate: string;
  product: string;
  quantity: number;
  trays: number;
  unitPrice: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FlockProduction {
  flockId: string;
  name: string;
  trays: number;
  eggs: number;
}

export interface Stock {
  id?: string;
  trays: number;
  eggs: number;
  brokenEggs: number;
  date: string;
  userId: string;
  flocks?: FlockProduction[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Expense {
  id?: string;
  category: string;
  description: string;
  date: string;
  amount: number;
  paymentMethod: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DebtorPayment {
  id?: string;
  customerName: string;
  amountPaid: number;
  date: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;

  // Business Information
  businessName: string;
  phoneNumber?: string;
  businessAddress?: string;
  businessType?: string;

  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

export interface Flock {
  id?: string;
  name: string;
  farm: string;
  birds: number;
  layingHens: number;
  age: string;
  started: string;
  type: string;
  status: 'Active' | 'On Hold' | 'Completed';
  metric: string;
  metricLabel: string;
  image: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

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
  updatedAt?: any;
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
  updatedAt?: any;
}

export interface FeedStock {
  feedType: string;
  purchasedKg: number;
  consumedKg: number;
  availableKg: number;
  totalCost: number;
  averagePricePerKg: number;
  lowStock: boolean;
}

// ==========================================
// HEALTH RECORDS INTERFACES
// ==========================================

export type HealthRecordType =
  | 'health'
  | 'vaccination'
  | 'treatment'
  | 'mortality';

export type HealthStatus =
  | 'sick'
  | 'under-treatment'
  | 'recovered'
  | 'vaccinated'
  | 'dead'
  | 'monitoring';

export interface HealthRecord {
  id?: string;

  // Ownership and flock
  userId: string;
  flockId: string;
  flockName: string;

  // Record information
  recordType: HealthRecordType;
  recordDate: string;

  // General health information
  disease?: string;
  symptoms?: string;
  diagnosis?: string;

  // Vaccination information
  vaccineName?: string;
  vaccinatedBirds?: number;
  nextVaccinationDate?: string;

  // Treatment information
  medicineName?: string;
  dosage?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;

  // Bird health statistics
  affectedBirds?: number;
  recoveredBirds?: number;
  deadBirds?: number;

  // Mortality information
  causeOfDeath?: string;

  // Treatment expenses and administration
  treatmentCost?: number;
  supplier?: string;
  administeredBy?: string;

  // Status and notes
  status: HealthStatus;
  notes?: string;

  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

interface FlockImpact {
  birds: number;
  layingHens: number;
}