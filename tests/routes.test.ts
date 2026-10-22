import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  vehicleRows: [] as any[],
  vehicleFind: vi.fn(),
  vehicleExists: vi.fn(),
  serviceFind: vi.fn(),
  serviceFindOne: vi.fn(),
  serviceCreate: vi.fn(),
  serviceUpdate: vi.fn(),
  expenseFind: vi.fn(),
  reminderFind: vi.fn(),
  reminderClaim: vi.fn(),
  reminderUpdate: vi.fn(),
  userFindOne: vi.fn(),
  userExists: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  resetCreate: vi.fn(),
  resetDelete: vi.fn(),
  resetClaim: vi.fn(),
  resetDeleteMany: vi.fn(),
  documentCreate: vi.fn(),
  blobPut: vi.fn(),
  blobDel: vi.fn(),
  aiCreate: vi.fn(),
}));

vi.mock('../server/models', () => ({
  User: { findById: vi.fn(), findOne: mocks.userFindOne, exists: mocks.userExists, create: mocks.userCreate, updateOne: mocks.userUpdate, countDocuments: vi.fn() },
  Vehicle: { find: mocks.vehicleFind, findOne: vi.fn(), exists: mocks.vehicleExists, create: vi.fn(), countDocuments: vi.fn() },
  ServiceRecord: { find: mocks.serviceFind, findOne: mocks.serviceFindOne, findOneAndUpdate: mocks.serviceUpdate, create: mocks.serviceCreate },
  Expense: { find: mocks.expenseFind, create: vi.fn() },
  Reminder: { find: mocks.reminderFind, findOneAndUpdate: mocks.reminderClaim, updateOne: mocks.reminderUpdate, create: vi.fn() },
  VehicleDocument: { find: vi.fn(), findOne: vi.fn(), create: mocks.documentCreate },
  Feedback: { find: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(), create: vi.fn(), countDocuments: vi.fn() },
  ResetToken: { findOne: vi.fn(), create: mocks.resetCreate, deleteOne: mocks.resetDelete, findOneAndUpdate: mocks.resetClaim, deleteMany: mocks.resetDeleteMany },
  RateLimit: { findOneAndUpdate: vi.fn() },
}));

vi.mock('../server/database', () => ({ connectDatabase: vi.fn(async () => undefined) }));
vi.mock('../server/security', () => ({
  requireUser: (req: any, _res: any, next: any) => { const owner = req.get('x-test-owner'); if (owner) req.userId = owner; next(); },
  requireCsrf: (_req: any, _res: any, next: any) => next(),
  durableRateLimit: () => (_req: any, _res: any, next: any) => next(),
  loadCurrentUser: (req: any, _res: any, next: any) => { req.userRole = 'admin'; req.userEmail = 'admin@example.com'; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
  hashPassword: vi.fn(async () => 'test-password-hash'),
  verifyPassword: vi.fn(async () => true),
  digestToken: vi.fn((token: string) => `digest:${token}`),
  newSecretToken: vi.fn(() => 'x'.repeat(48)),
}));
vi.mock('@vercel/blob', () => ({ del: mocks.blobDel, issueSignedToken: vi.fn(), presignUrl: vi.fn(), put: mocks.blobPut }));
vi.mock('openai', () => ({ default: class { chat = { completions: { create: mocks.aiCreate } }; } }));

import { apiRouter } from '../server/routes';

const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.session = { regenerate: (callback: () => void) => callback(), save: (callback: () => void) => callback() };
  next();
});
app.use('/api', apiRouter);

function queryResult<T>(result: T) {
  const query: any = {
    sort() { return query; },
    select() { return query; },
    limit() { return query; },
    populate() { return query; },
    lean: async () => result,
  };
  return query;
}

const envKeys = ['BLOB_READ_WRITE_TOKEN', 'AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'RESEND_API_KEY', 'EMAIL_FROM', 'APP_BASE_URL', 'CRON_SECRET', 'ADMIN_EMAILS'] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mocks.vehicleRows = [];
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

describe('API access, validation, and safe failure behavior', () => {
  it('returns only records owned by the authenticated account', async () => {
    const idA = '0123456789abcdef01234567';
    const idB = '1123456789abcdef01234567';
    mocks.vehicleRows = [
      { _id: idA, ownerId: 'owner-a', make: 'Honda', model: 'City', year: 2022, status: 'Active' },
      { _id: idB, ownerId: 'owner-b', make: 'Toyota', model: 'Yaris', year: 2021, status: 'Active' },
    ];
    mocks.vehicleFind.mockImplementation((filter: { ownerId: string }) => queryResult(mocks.vehicleRows.filter((row) => row.ownerId === filter.ownerId)));
    const a = await request(app).get('/api/vehicles').set('x-test-owner', 'owner-a').expect(200);
    const b = await request(app).get('/api/vehicles').set('x-test-owner', 'owner-b').expect(200);
    expect(a.body.items.map((item: any) => item.make)).toEqual(['Honda']);
    expect(b.body.items.map((item: any) => item.make)).toEqual(['Toyota']);
    expect(mocks.vehicleFind).toHaveBeenNthCalledWith(1, { ownerId: 'owner-a' });
    expect(mocks.vehicleFind).toHaveBeenNthCalledWith(2, { ownerId: 'owner-b' });
  });

  it('does not return a protected vehicle list without an authenticated owner', async () => {
    await request(app).get('/api/vehicles').expect(401);
    expect(mocks.vehicleFind).not.toHaveBeenCalled();
  });

  it('never grants administrator role through public registration, even for an allowlisted email', async () => {
    process.env.ADMIN_EMAILS = 'owner@example.test';
    mocks.userExists.mockResolvedValue(false);
    mocks.userCreate.mockImplementation(async (value: any) => ({ _id: 'user-1', ...value }));
    await request(app).post('/api/auth/register').send({
      name: 'Vehicle Owner', email: 'owner@example.test', password: 'correct horse battery staple',
    }).expect(201);
    expect(mocks.userCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'owner@example.test', role: 'user' }));
  });

  it('refuses a document upload for a vehicle the account does not own', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'unit-test-only';
    mocks.vehicleExists.mockResolvedValue(false);
    await request(app).post('/api/documents/upload')
      .set('x-test-owner', 'owner-a').set('content-type', 'application/pdf')
      .set('x-vehicle-id', '0123456789abcdef01234567')
      .set('x-file-name', encodeURIComponent('policy.pdf'))
      .set('x-document-name', encodeURIComponent('Insurance policy'))
      .set('x-document-kind', 'Insurance').send(Buffer.from('%PDF-1.4 test')).expect(404);
    expect(mocks.vehicleExists).toHaveBeenCalledWith({ _id: '0123456789abcdef01234567', ownerId: 'owner-a' });
    expect(mocks.blobPut).not.toHaveBeenCalled();
  });

  it('rejects a MIME header that does not match the uploaded file signature', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'unit-test-only';
    mocks.vehicleExists.mockResolvedValue(true);
    await request(app).post('/api/documents/upload')
      .set('x-test-owner', 'owner-a').set('content-type', 'image/jpeg')
      .set('x-vehicle-id', '0123456789abcdef01234567')
      .set('x-file-name', encodeURIComponent('policy.jpg')).send(Buffer.from('%PDF-1.4 not-a-jpeg')).expect(400);
    expect(mocks.blobPut).not.toHaveBeenCalled();
  });

  it('deletes a private Blob if its MongoDB metadata write fails', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'unit-test-only';
    mocks.vehicleExists.mockResolvedValue(true);
    mocks.blobPut.mockResolvedValue({ pathname: 'private/policy.pdf', url: 'https://blob.example/private/policy.pdf' });
    mocks.documentCreate.mockRejectedValue(new Error('database test detail'));
    mocks.blobDel.mockResolvedValue(undefined);
    await request(app).post('/api/documents/upload')
      .set('x-test-owner', 'owner-a').set('content-type', 'application/pdf')
      .set('x-vehicle-id', '0123456789abcdef01234567')
      .set('x-file-name', encodeURIComponent('policy.pdf'))
      .set('x-document-name', encodeURIComponent('Insurance policy'))
      .set('x-document-kind', 'Insurance').send(Buffer.from('%PDF-1.4 test')).expect(503);
    expect(mocks.blobPut).toHaveBeenCalledOnce();
    expect(mocks.blobDel).toHaveBeenCalledWith('https://blob.example/private/policy.pdf');
  });

  it('returns a safe unavailable state when AI credentials are not configured', async () => {
    const response = await request(app).post('/api/ai/insights').set('x-test-owner', 'owner-a').send({}).expect(503);
    expect(response.body.error).toMatch(/not configured/i);
    expect(mocks.vehicleFind).not.toHaveBeenCalled();
  });

  it('handles an upstream AI failure without returning provider details', async () => {
    process.env.AI_GATEWAY_API_KEY = 'unit-test-only';
    mocks.vehicleFind.mockImplementation(() => queryResult([{ _id: '0123456789abcdef01234567', make: 'Honda', model: 'City', year: 2022, odometer: 12000 }]));
    mocks.serviceFind.mockImplementation(() => queryResult([]));
    mocks.expenseFind.mockImplementation(() => queryResult([]));
    mocks.reminderFind.mockImplementation(() => queryResult([]));
    mocks.aiCreate.mockRejectedValue(new Error('provider test detail'));
    const response = await request(app).post('/api/ai/insights').set('x-test-owner', 'owner-a').send({}).expect(502);
    expect(response.body.error).toMatch(/temporarily unavailable/i);
    expect(JSON.stringify(response.body)).not.toContain('provider test detail');
  });

  it('rejects malformed or implausibly short AI completions', async () => {
    process.env.AI_GATEWAY_API_KEY = 'unit-test-only';
    mocks.vehicleFind.mockImplementation(() => queryResult([{ _id: '0123456789abcdef01234567', make: 'Honda', model: 'City', year: 2022, odometer: 12000 }]));
    mocks.serviceFind.mockImplementation(() => queryResult([]));
    mocks.expenseFind.mockImplementation(() => queryResult([]));
    mocks.reminderFind.mockImplementation(() => queryResult([]));
    mocks.aiCreate.mockResolvedValue({ choices: [{ message: { content: 'not enough' } }] });
    const response = await request(app).post('/api/ai/insights').set('x-test-owner', 'owner-a').send({}).expect(502);
    expect(response.body.error).toMatch(/invalid insight/i);
  });

  it('rejects a service reading lower than an earlier reading for the same vehicle', async () => {
    const vehicleId = '0123456789abcdef01234567';
    mocks.vehicleExists.mockResolvedValue(true);
    mocks.serviceFind.mockImplementation((filter: any) => filter.date?.$lt
      ? queryResult([{ date: '2026-01-01', odometer: 12000 }])
      : queryResult([]));
    await request(app).post('/api/services').set('x-test-owner', 'owner-a').send({
      vehicleId, date: '2026-03-15', serviceType: 'Oil change', odometer: 11000, cost: 500,
    }).expect(409);
    expect(mocks.serviceCreate).not.toHaveBeenCalled();
  });

  it('rejects a service edit that would make a later odometer reading decrease', async () => {
    const vehicleId = '0123456789abcdef01234567';
    const serviceId = '1123456789abcdef01234567';
    mocks.vehicleExists.mockResolvedValue(true);
    mocks.serviceFindOne.mockReturnValue(queryResult({ _id: serviceId }));
    mocks.serviceFind.mockImplementation((filter: any) => filter.date?.$gt
      ? queryResult([{ date: '2026-07-01', odometer: 14000 }])
      : queryResult([]));
    await request(app).patch(`/api/services/${serviceId}`).set('x-test-owner', 'owner-a').send({
      vehicleId, date: '2026-05-15', serviceType: 'Filter change', odometer: 15000, cost: 250,
    }).expect(409);
    expect(mocks.serviceUpdate).not.toHaveBeenCalled();
  });

  it('uses atomic one-time reset-token consumption and invalidates prior sessions', async () => {
    const token = 'r'.repeat(48);
    mocks.resetClaim
      .mockReturnValueOnce(queryResult({ _id: 'token-1', userId: 'user-1', sessionVersion: 7 }))
      .mockReturnValueOnce(queryResult(null));
    mocks.userUpdate.mockResolvedValue({ matchedCount: 1 });
    mocks.resetDeleteMany.mockResolvedValue({ deletedCount: 1 });
    const body = { token, password: 'correct horse battery staple' };
    await request(app).post('/api/auth/reset-password').send(body).expect(200);
    await request(app).post('/api/auth/reset-password').send(body).expect(400);
    expect(mocks.userUpdate).toHaveBeenCalledOnce();
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      { _id: 'user-1', active: true, sessionVersion: 7 },
      { $set: { passwordHash: 'test-password-hash' }, $inc: { sessionVersion: 1 } },
    );
  });

  it('returns the same generic recovery response if a registered address delivery fails', async () => {
    process.env.RESEND_API_KEY = 'unit-test-only';
    process.env.EMAIL_FROM = 'Vehicle Desk <no-reply@example.test>';
    process.env.APP_BASE_URL = 'https://vehicle.example';
    mocks.userFindOne.mockReturnValue({ select: () => queryResult({ _id: 'user-1', email: 'owner@example.test', sessionVersion: 2 }) });
    mocks.resetCreate.mockResolvedValue({});
    mocks.resetDelete.mockResolvedValue({ deletedCount: 1 });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const response = await request(app).post('/api/auth/forgot-password').send({ email: 'owner@example.test' }).expect(200);
    expect(response.body.message).toMatch(/if an active account matches/i);
    expect(mocks.resetDelete).toHaveBeenCalledWith({ tokenHash: `digest:${'x'.repeat(48)}` });
  });

  it('sends an escaped, at-most-one concurrent reminder email per claimed reminder', async () => {
    process.env.CRON_SECRET = 'unit-cron-secret';
    process.env.RESEND_API_KEY = 'unit-test-only';
    process.env.EMAIL_FROM = 'Vehicle Desk <no-reply@example.test>';
    const reminder = {
      _id: 'reminder-1', ownerId: 'owner-a', dueDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
      title: '<img src=x onerror=alert(1)>', dismissed: false,
    };
    mocks.reminderFind.mockReturnValue(queryResult([reminder]));
    mocks.userFindOne.mockReturnValue({ select: () => queryResult({ email: 'owner@example.test' }) });
    let alreadyClaimed = false;
    mocks.reminderClaim.mockImplementation(() => {
      if (alreadyClaimed) return queryResult(null);
      alreadyClaimed = true;
      return queryResult(reminder);
    });
    mocks.reminderUpdate.mockResolvedValue({ acknowledged: true });
    const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({ input, init });
      return { ok: true } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const [first, second] = await Promise.all([
      request(app).get('/api/cron/reminders').set('authorization', 'Bearer unit-cron-secret'),
      request(app).get('/api/cron/reminders').set('authorization', 'Bearer unit-cron-secret'),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect([first.body.sent, second.body.sent].reduce((sum, count) => sum + count, 0)).toBe(1);
    expect(mocks.reminderClaim).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledOnce();
    const emailPayload = JSON.parse(String(fetchCalls[0]?.init?.body));
    expect(emailPayload.html).toContain('&lt;img');
    expect(emailPayload.html).not.toContain('<img');
    expect(fetchCalls[0]?.init?.headers).toMatchObject({ 'Idempotency-Key': 'vehicle-reminder-reminder-1-' + reminder.dueDate });
  });
});
