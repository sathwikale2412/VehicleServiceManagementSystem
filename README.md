# Vehicle Desk

Vehicle Desk is a vehicle-service record manager based on the supplied project specification. It brings together vehicles, service history, expenses, insurance/PUCC documents, reminders, reports, profile settings, support, an administrator area, and an evidence-grounded AI assistant.

## Stack and layout

- `src/` contains the React + TypeScript client, responsive workspace, pages, shared UI and styles.
- `server/` contains the Express API, security/session middleware, MongoDB models, reminder processing and report aggregation.
- `shared/` contains request validation schemas used at the server boundary.
- `api/index.ts` adapts the Express API to Vercel Functions; `vercel.json` routes `/api/*` ahead of the single-page-app fallback.
- MongoDB stores account-owned records. Uploaded document bytes are intended for private Vercel Blob storage; only their metadata and owner references are stored in MongoDB.

## Local development

Use Node.js 22 and pnpm 11 (the project pins pnpm). Then run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The WebDev Preview uses port 3000. `GET /api/health` reports API process health; `GET /api/status` lists which protected integrations are configured. If MongoDB or another provider is not configured, the app keeps its data-dependent features unavailable and displays setup-aware messages rather than inventing persisted records.

Run the checks with:

```sh
pnpm test
pnpm build
```

Tests use mocks and do not write to a production database.

## Protected runtime settings

Copy `.env.example` only for local development. Never commit real values. Configure production and preview values separately in Vercel's protected Environment Variables:

- `MONGODB_URI`: MongoDB connection string for the application database; permit access from the deployment runtime.
- `SESSION_SECRET`: a long, random, application-specific signing secret.
- `ADMIN_EMAILS`: comma-separated verified addresses allowed to use administrator routes. Public registration always creates a normal user; never assign the admin role from the browser.
- `APP_BASE_URL`: canonical public site origin, used for account-recovery links.
- `RESEND_API_KEY` and `EMAIL_FROM`: verified email-sender configuration for recovery and scheduled reminder delivery.
- `CRON_SECRET`: long random bearer secret for the scheduled reminder endpoint.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob credential for the project's private store. The server creates short-lived, owner-authorized download links; do not make document blobs public.
- `AI_GATEWAY_API_KEY`: optional protected Vercel AI Gateway key for environments that do not have a suitable Vercel OIDC credential. Set `AI_MODEL` to a Gateway model ID that the authenticated catalog marks as eligible for HTTP inference; `/api/status` fails closed unless that eligibility check succeeds. No model ID is guessed or silently defaulted.

`/api/status` indicates whether required providers are usable; it never returns their values. AI readiness is checked against the authenticated Gateway model catalog and fails closed unless the selected language model is eligible for HTTP inference. In-app reminders and deterministic record summaries remain available when email or AI is unavailable. The Vercel Cron declaration requests one daily run at 08:00 India time; email delivery still requires a working provider and configured sender.

### Administrator provisioning

The email allowlist does not promote accounts by itself. After the database owner independently verifies mailbox ownership (for example, after the person receives an account-recovery email), the owner may set `role: "admin"` on that account's MongoDB user record. Every administrator request checks both this persisted role and the current `ADMIN_EMAILS` allowlist; removing an address revokes administrator API access immediately. The profile shows the sign-in email read-only; editing it would require a separate verified-email change flow.

## Deployment

The approved production host is Vercel and the database is MongoDB. Vercel's linked Git deployment should build from the repository root with `pnpm install --frozen-lockfile` and `pnpm build`, publishing `dist/` and the `/api` functions. Do not claim a public production URL until a Vercel deployment reaches READY and its health/route behavior has been checked.
