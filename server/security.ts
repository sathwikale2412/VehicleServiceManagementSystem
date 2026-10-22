import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Types } from 'mongoose';
import { connectDatabase } from './database';
import { RateLimit, User } from './models';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'user' | 'admin';
  userEmail?: string;
}

let sessionHandler: RequestHandler | undefined;

export function sessionCookieOptions() {
  const plainHttpLocal = process.env.LOCAL_HTTP_DEV === 'true' && !process.env.VERCEL && !process.env.MANUS_PROJECT_ID;
  return {
    httpOnly: true,
    secure: !plainHttpLocal,
    sameSite: plainHttpLocal ? 'lax' as const : 'none' as const,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    path: '/',
  };
}

export async function installSession(req: Request, res: Response, next: NextFunction) {
  const sessionSecret = process.env.SESSION_SECRET;
  const mongoUrl = process.env.MONGODB_URI;
  if (!sessionSecret || !mongoUrl) {
    return res.status(503).json({ error: 'Account services are not configured yet.' });
  }
  try {
    await connectDatabase();
    sessionHandler ??= session({
      name: 'vehicle_desk_session',
      secret: sessionSecret,
      store: MongoStore.create({ mongoUrl, collectionName: 'sessions', ttl: 60 * 60 * 24 * 14 }),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: sessionCookieOptions(),
    });
    sessionHandler(req, res, next);
  } catch {
    return res.status(503).json({ error: 'Account services are temporarily unavailable.' });
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function newSecretToken() {
  return randomBytes(32).toString('base64url');
}

export function digestToken(token: string) {
  return createHmac('sha256', process.env.SESSION_SECRET ?? 'unconfigured-token-salt').update(token).digest('hex');
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const supplied = req.get('x-csrf-token') ?? '';
  const expected = req.session.csrfToken ?? '';
  if (!supplied || !expected || supplied.length !== expected.length) {
    return res.status(403).json({ error: 'Refresh the page and try again.' });
  }
  const valid = timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return res.status(403).json({ error: 'Refresh the page and try again.' });
  next();
}

export async function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId || !Types.ObjectId.isValid(userId)) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const user = await User.findById(userId).select('role email active sessionVersion').lean();
    if (!user?.active || (user.sessionVersion ?? 0) !== (req.session.sessionVersion ?? 0)) {
      req.session.destroy(() => undefined);
      return res.status(401).json({ error: 'Sign in to continue.' });
    }
    req.userId = userId;
    req.userRole = user.role;
    req.userEmail = user.email;
    next();
  } catch {
    return res.status(503).json({ error: 'Account services are temporarily unavailable.' });
  }
}

export async function loadCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const user = await User.findById(req.userId).select('name email role active phone address sessionVersion').lean();
    if (!user?.active || (user.sessionVersion ?? 0) !== (req.session.sessionVersion ?? 0)) return res.status(401).json({ error: 'Sign in to continue.' });
    req.userRole = user.role;
    req.userEmail = user.email;
    next();
  } catch {
    return res.status(503).json({ error: 'Account services are temporarily unavailable.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowlist = new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean));
  if (req.userRole !== 'admin' || !req.userEmail || !allowlist.has(req.userEmail.toLowerCase())) {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
}

export function durableRateLimit(limit: number, windowMs: number): RequestHandler {
  return async (req, res, next) => {
    try {
      await connectDatabase();
      const secret = process.env.SESSION_SECRET;
      if (!secret) return res.status(503).json({ error: 'Account services are not configured yet.' });
      const identity = createHmac('sha256', secret).update(`${req.ip ?? 'unknown'}:${req.path}`).digest('hex');
      const bucket = Math.floor(Date.now() / windowMs);
      const entry = await RateLimit.findOneAndUpdate(
        { key: identity, bucket },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
      if (entry && entry.count > limit) return res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
      next();
    } catch {
      return res.status(503).json({ error: 'Account services are temporarily unavailable.' });
    }
  };
}
