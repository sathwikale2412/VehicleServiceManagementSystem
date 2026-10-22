import mongoose, { Schema, Types } from 'mongoose';

const { ObjectId } = Schema.Types;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  address: { type: String, trim: true, maxlength: 250, default: '' },
  active: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0 },
}, { timestamps: true });

const vehicleSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  make: { type: String, required: true, trim: true, maxlength: 60 },
  model: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true },
  registration: { type: String, required: true, trim: true, maxlength: 30 },
  fuelType: { type: String, required: true },
  odometer: { type: Number, required: true, min: 0 },
  purchaseDate: String,
  registrationDate: String,
  insuranceExpiry: String,
  puccExpiry: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });
vehicleSchema.index({ ownerId: 1, registration: 1 }, { unique: true });

const serviceSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: ObjectId, ref: 'Vehicle', required: true, index: true },
  date: { type: String, required: true, index: true },
  serviceType: { type: String, required: true, maxlength: 80 },
  odometer: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  workshop: { type: String, maxlength: 120, default: '' },
  notes: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

const expenseSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: ObjectId, ref: 'Vehicle', default: null, index: true },
  date: { type: String, required: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true, maxlength: 160 },
  amount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

const reminderSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: ObjectId, ref: 'Vehicle', default: null, index: true },
  kind: { type: String, required: true },
  title: { type: String, required: true, maxlength: 120 },
  dueDate: { type: String, required: true, index: true },
  notes: { type: String, maxlength: 500, default: '' },
  dismissed: { type: Boolean, default: false },
  lastNotifiedAt: { type: Date, default: null },
  notificationClaimedAt: { type: Date, default: null },
}, { timestamps: true });

const documentSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: ObjectId, ref: 'Vehicle', required: true, index: true },
  name: { type: String, required: true, maxlength: 120 },
  kind: { type: String, required: true },
  expiryDate: { type: String, default: '' },
  pathname: { type: String, required: true, select: false },
  blobUrl: { type: String, required: true, select: false },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
}, { timestamps: true });

const feedbackSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 3000 },
  status: { type: String, enum: ['Open', 'In review', 'Resolved'], default: 'Open' },
  adminReply: { type: String, maxlength: 2000, default: '' },
}, { timestamps: true });

const resetTokenSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  sessionVersion: { type: Number, required: true, default: 0 },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

const rateLimitSchema = new Schema({
  key: { type: String, required: true },
  bucket: { type: Number, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
rateLimitSchema.index({ key: 1, bucket: 1 }, { unique: true });

function model<T = unknown>(name: string, schema: Schema) {
  return (mongoose.models[name] as mongoose.Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

export const User = model<any>('User', userSchema);
export const Vehicle = model<any>('Vehicle', vehicleSchema);
export const ServiceRecord = model<any>('ServiceRecord', serviceSchema);
export const Expense = model<any>('Expense', expenseSchema);
export const Reminder = model<any>('Reminder', reminderSchema);
export const VehicleDocument = model<any>('VehicleDocument', documentSchema);
export const Feedback = model<any>('Feedback', feedbackSchema);
export const ResetToken = model<any>('ResetToken', resetTokenSchema);
export const RateLimit = model<any>('RateLimit', rateLimitSchema);

export type UserDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  active: boolean;
  sessionVersion?: number;
};

export type OwnedDocument = { _id: Types.ObjectId; ownerId: Types.ObjectId; [key: string]: unknown };
