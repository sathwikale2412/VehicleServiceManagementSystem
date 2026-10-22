import mongoose from 'mongoose';

let connectionPromise: Promise<typeof mongoose> | undefined;

export class DatabaseSetupError extends Error {
  constructor() {
    super('MongoDB has not been configured for this deployment.');
    this.name = 'DatabaseSetupError';
  }
}

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseSetupError();
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 7000,
      maxPoolSize: 8,
      minPoolSize: 0,
      autoIndex: process.env.NODE_ENV !== 'production',
    }).catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}
