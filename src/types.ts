export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
};

export type AppStatus = {
  databaseConfigured: boolean;
  sessionConfigured: boolean;
  emailConfigured: boolean;
  blobConfigured: boolean;
  aiConfigured: boolean;
  adminConfigured: boolean;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  fuelType: string;
  odometer: number;
  purchaseDate?: string;
  registrationDate?: string;
  insuranceExpiry?: string;
  puccExpiry?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
};

export type Reminder = {
  id: string;
  vehicleId?: string;
  vehicle?: string | null;
  kind: string;
  title: string;
  dueDate: string;
  dismissed: boolean;
  notes?: string;
};

export type DashboardData = {
  vehicleCount: number;
  reminderCount: number;
  currentMonthTotal: number;
  yearTotal: number;
  reminders: Reminder[];
  recentServices: Array<Record<string, unknown>>;
  vehicles: Vehicle[];
};

export type RecordItem = Record<string, any> & { id: string };
