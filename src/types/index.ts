export type AuthCredentials = {
  email: string;
  password: string;
};

export type SignupCredentials = {
  name: string;
  email: string;
  password: string;
};

export type SuperAdminUser = {
  id: number;
  email: string;
  role: string;
};

export type SummaryStats = {
  totalUsers: number;
  blockedUsers: number;
  totalHotels: number;
  activeHotels: number;
  totalOrders: number;
  totalPackages: number;
  totalRevenue: number;
  activeSubscriptions: number;
  expiredLicenses: number;
  expiredHotels: Array<{
    hotelName: string;
    userEmail: string;
    expiryDate: string;
  }>;
};

export type PackageItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  durationValue: number;
  durationUnit: 'day' | 'month' | 'year';
  features: string[];
  modules: string[];
  activeSubscribers: number;
  isTrial?: boolean;
  isEnabled?: boolean;
  createdAt: string;
};

export type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hotels: string;
  status: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: number;
  amount: number;
  status: string;
  transactionId: string;
  packageName: string;
  userEmail: string;
  userName: string;
  hotelName: string;
  expiryDate: string | null;
  createdAt: string;
};

export type SubscriberRecord = {
  userEmail: string;
  hotelName: string;
  packageName: string;
  subscribedAt: string;
  expiryDate: string | null;
};

// In your types file
export interface ExpiredLicenseRecord {
  userId: number;
  userEmail: string;
  hotelName: string;
  phone?: string;
  expiryDate: string;
  isBlocked: boolean;
  daysExpired?: number;
}

export interface UserDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  licenceKey: string;
  licenceExpiryDate: string;
  createdAt: string;
  hotels: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

// types/index.ts
export interface AuditEntry {
  id: number;
  action: string;
  actor: string;
  actorId?: number;
  actorRole?: string;
  target: string;
  targetId?: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  method: string;
  endpoint: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}
export interface LicenseInfo {
  userId: number;
  userEmail: string;
  userName: string;
  hasLicense: boolean;
  status: 'active' | 'expired' | 'no_license';
  expiryDate: string | null;
  daysRemaining: number;
  packageName: string;
  packageId: number | null;
  isBlocked: boolean;
  hotels: string[];
}