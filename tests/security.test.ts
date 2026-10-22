import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ userFindById: vi.fn() }));
vi.mock('../server/models', () => ({ User: { findById: mocks.userFindById }, RateLimit: { findOneAndUpdate: vi.fn() } }));
vi.mock('../server/database', () => ({ connectDatabase: vi.fn(async () => undefined) }));

import { requireAdmin, requireCsrf, requireUser, sessionCookieOptions } from '../server/security';

const app = express();
app.use((req: any, _res: any, next: any) => {
  const sessionVersion = Number(req.get('x-test-session-version') ?? 0);
  req.session = {
    userId: req.get('x-test-session-user') ?? undefined,
    sessionVersion,
    csrfToken: 'known-token',
    destroy: (callback: () => void) => callback(),
  };
  next();
});
app.get('/protected', requireUser, (req: any, res) => res.json({ userId: req.userId, role: req.userRole }));
app.get('/admin', requireUser, requireAdmin, (_req, res) => res.status(204).end());
app.post('/write', requireCsrf, (_req, res) => res.status(204).end());

function userQuery(user: any) {
  return { select: () => ({ lean: async () => user }) };
}
const environment = ['LOCAL_HTTP_DEV', 'VERCEL', 'MANUS_PROJECT_ID', 'ADMIN_EMAILS'] as const;
const before = Object.fromEntries(environment.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.clearAllMocks();
  for (const key of environment) {
    const value = before[key];
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

describe('session and CSRF boundaries', () => {
  it('accepts an active session only when the persisted session version matches', async () => {
    mocks.userFindById.mockReturnValue(userQuery({ active: true, role: 'user', sessionVersion: 4 }));
    const response = await request(app).get('/protected').set('x-test-session-user', '0123456789abcdef01234567').set('x-test-session-version', '4').expect(200);
    expect(response.body).toEqual({ userId: '0123456789abcdef01234567', role: 'user' });
  });
  it('rejects missing and stale sessions', async () => {
    await request(app).get('/protected').expect(401);
    mocks.userFindById.mockReturnValue(userQuery({ active: true, role: 'user', sessionVersion: 5 }));
    await request(app).get('/protected').set('x-test-session-user', '0123456789abcdef01234567').set('x-test-session-version', '4').expect(401);
  });
  it('requires the session CSRF token for state-changing requests', async () => {
    await request(app).post('/write').expect(403);
    await request(app).post('/write').set('x-csrf-token', 'known-token').expect(204);
  });
  it('keeps public HTTPS Preview cookies Secure and SameSite=None even with local mode enabled', () => {
    process.env.LOCAL_HTTP_DEV = 'true';
    process.env.VERCEL = '1';
    expect(sessionCookieOptions()).toMatchObject({ httpOnly: true, secure: true, sameSite: 'none', path: '/' });
  });
  it('uses Lax cookies only when explicitly running plain local HTTP', () => {
    process.env.LOCAL_HTTP_DEV = 'true';
    delete process.env.VERCEL;
    delete process.env.MANUS_PROJECT_ID;
    expect(sessionCookieOptions()).toMatchObject({ secure: false, sameSite: 'lax' });
  });
  it('requires both a persisted admin role and current allowlist membership', async () => {
    const id = '0123456789abcdef01234567';
    mocks.userFindById.mockReturnValue(userQuery({ active: true, role: 'admin', email: 'admin@example.com', sessionVersion: 0 }));
    process.env.ADMIN_EMAILS = 'other@example.com';
    await request(app).get('/admin').set('x-test-session-user', id).expect(403);
    process.env.ADMIN_EMAILS = ' Admin@example.com ';
    await request(app).get('/admin').set('x-test-session-user', id).expect(204);
    mocks.userFindById.mockReturnValue(userQuery({ active: true, role: 'user', email: 'admin@example.com', sessionVersion: 0 }));
    await request(app).get('/admin').set('x-test-session-user', id).expect(403);
  });
});
