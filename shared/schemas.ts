import { z } from 'zod';

const cleanText = (max: number) => z.string().trim().max(max);
const nonNegativeMoney = z.number().finite().min(0).max(100_000_000);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date.');

export const registerSchema = z.object({
  name: cleanText(100).min(2),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const vehicleSchema = z.object({
  make: cleanText(60).min(1),
  model: cleanText(80).min(1),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  registration: cleanText(30).min(1),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other']),
  odometer: z.number().finite().int().min(0).max(2_000_000),
  purchaseDate: isoDate.optional().or(z.literal('')),
  registrationDate: isoDate.optional().or(z.literal('')),
  insuranceExpiry: isoDate.optional().or(z.literal('')),
  puccExpiry: isoDate.optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  notes: cleanText(1000).optional(),
}).strict();

export const serviceSchema = z.object({
  vehicleId: z.string().min(1),
  date: isoDate,
  serviceType: cleanText(80).min(1),
  odometer: z.number().int().min(0).max(2_000_000),
  cost: nonNegativeMoney,
  workshop: cleanText(120).optional(),
  notes: cleanText(1000).optional(),
}).strict();

export const expenseSchema = z.object({
  vehicleId: z.string().optional().or(z.literal('')),
  date: isoDate,
  category: z.enum(['Service', 'Fuel', 'Repair', 'Insurance', 'Parts', 'Other']),
  description: cleanText(160).min(1),
  amount: nonNegativeMoney,
}).strict();

export const reminderSchema = z.object({
  vehicleId: z.string().optional().or(z.literal('')),
  kind: z.enum(['Service', 'Insurance renewal', 'PUCC renewal', 'Other']),
  title: cleanText(120).min(1),
  dueDate: isoDate,
  notes: cleanText(500).optional(),
  dismissed: z.boolean().default(false),
}).strict();

export const documentSchema = z.object({
  vehicleId: z.string().min(1),
  name: cleanText(120).min(1),
  kind: z.enum(['Insurance', 'PUCC', 'Registration', 'Service invoice', 'Other']),
  expiryDate: isoDate.optional().or(z.literal('')),
  pathname: z.string().min(1).max(600),
  blobUrl: z.url().max(1500),
  contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(5 * 1024 * 1024),
}).strict();

export const feedbackSchema = z.object({
  subject: cleanText(120).min(3),
  message: cleanText(3000).min(10),
}).strict();

export const profileSchema = z.object({
  name: cleanText(100).min(2),
  phone: cleanText(30).optional(),
  address: cleanText(250).optional(),
}).strict();

export const forgotPasswordSchema = z.object({ email: z.email().max(254).transform((value) => value.toLowerCase()) });
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(200), password: z.string().min(12).max(128) });

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
