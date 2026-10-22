import { describe, expect, it } from 'vitest';
import { expenseSchema, registerSchema, reminderSchema, serviceSchema, vehicleSchema } from '../shared/schemas';

const validVehicle = { make: 'Honda', model: 'City', year: 2022, registration: 'MH01AB1234', fuelType: 'Petrol', odometer: 24000, status: 'Active' };

describe('account and vehicle schemas', () => {
  it('normalizes registration email and requires a strong password', () => {
    const parsed = registerSchema.parse({ name: 'A Driver', email: 'DRIVER@example.com', password: 'correct-horse-battery' });
    expect(parsed.email).toBe('driver@example.com');
    expect(registerSchema.safeParse({ name: 'A Driver', email: 'driver@example.com', password: 'short' }).success).toBe(false);
  });
  it('accepts a valid vehicle and rejects an invalid year or unexpected field', () => {
    expect(vehicleSchema.safeParse(validVehicle).success).toBe(true);
    expect(vehicleSchema.safeParse({ ...validVehicle, year: 1800 }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...validVehicle, ownerId: 'attacker' }).success).toBe(false);
  });
});

describe('record schemas', () => {
  it('rejects impossible calendar dates and negative service costs', () => {
    const service = { vehicleId: '0123456789abcdef01234567', date: '2026-02-30', serviceType: 'Oil change', odometer: 1000, cost: 1500 };
    expect(serviceSchema.safeParse(service).success).toBe(false);
    expect(serviceSchema.safeParse({ ...service, date: '2026-02-28', cost: -1 }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...service, date: '2026-02-28', cost: 1500 }).success).toBe(true);
  });
  it('accepts valid expenses but blocks negative amounts and invalid categories', () => {
    const expense = { vehicleId: '', date: '2026-10-23', category: 'Fuel', description: 'Full tank', amount: 3500 };
    expect(expenseSchema.safeParse(expense).success).toBe(true);
    expect(expenseSchema.safeParse({ ...expense, amount: -1 }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...expense, category: 'Gift' }).success).toBe(false);
  });
  it('rejects impossible reminder dates and validates the supported kinds', () => {
    const reminder = { vehicleId: '', kind: 'Insurance renewal', title: 'Renew policy', dueDate: '2026-11-31', dismissed: false };
    expect(reminderSchema.safeParse(reminder).success).toBe(false);
    expect(reminderSchema.safeParse({ ...reminder, dueDate: '2026-11-30' }).success).toBe(true);
  });
});
