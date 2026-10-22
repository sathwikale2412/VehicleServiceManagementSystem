import express from 'express';
import helmet from 'helmet';
import { isAiModelEligible } from './ai-models';
import { apiRouter } from './routes';
import { connectDatabase } from './database';
import { installSession } from './security';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.blob.vercel-storage.com'],
      connectSrc: ["'self'", 'https://ai-gateway.vercel.sh', 'https://*.blob.vercel-storage.com'],
      formAction: ["'self'"],
      frameAncestors: ["'self'", 'https://*.manus.computer', 'https://*.manus.im'],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, service: 'vehicle-desk-api' });
});

app.get('/api/status', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const aiCredential = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  const aiConfigured = await isAiModelEligible(aiCredential, process.env.AI_MODEL);
  res.json({
    databaseConfigured: Boolean(process.env.MONGODB_URI),
    sessionConfigured: Boolean(process.env.SESSION_SECRET),
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_BASE_URL),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    aiConfigured,
    adminConfigured: Boolean(process.env.ADMIN_EMAILS?.trim()),
  });
});

app.use('/api', async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
      return res.status(503).json({ error: 'Account services are not configured yet.' });
    }
    await connectDatabase();
    return installSession(req, res, next);
  } catch {
    return res.status(503).json({ error: 'Account services are temporarily unavailable.' });
  }
});

app.use('/api', apiRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) return;
  const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 500;
  res.status(status).json({ error: status >= 500 ? 'The request could not be completed.' : 'The request is invalid.' });
});

export default app;
