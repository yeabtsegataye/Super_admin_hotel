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
  durationUnit: 'day' | 'month' | 'year'; // flexible duration type
  features: string[];
  activeSubscribers: number;
  isTrial?: boolean; // mark if package is trial
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

export type AuditEntry = {
  id: number;
  action: string;
  actor: string;
  target: string;
  details?: string;
  createdAt: string;
};
