# Vehicle Service Record Management System — implementation plan

**Status:** Approved direction: keep MongoDB and require Vercel for production deployment. Strict TypeScript plus the production build pass; all 40 unit/mocked-API tests pass across six suites. After the final backend fixes, Preview health and setup status return HTTP 200, and all 17 declared page routes are served by the route manifest. A production deployment still requires protected service settings, Vercel team access, and the owner-confirmed GitHub connection flow.

## Product scope and approach

Build a responsive, authenticated vehicle-maintenance web application based on the supplied six-page hand-drawn specification. The dashboard will show a live local date/time, vehicle count, upcoming services, expense totals, reminders, recent activity, and an AI assistant entry point. The persistent app will provide registration/login and account recovery; vehicle creation/list/detail; dated service history and odometer/cost records; categorized expenses and analytics; insurance/PUCC and other document records with secure uploads and expiry dates; service/document reminders; reports; profile/settings; feedback/support; and an administrator area. Values shown in the sketches suggest INR; use INR as the initial display currency, with date/time displayed in the user's local browser time.

The assistant area will produce on-demand, data-grounded maintenance and spending insights from the signed-in user's records. Treat its content as informational, identify the records/date range it used, and avoid presenting generated output as professional mechanical or insurance advice. Authorization and ownership checks remain server-side and apply to every record and uploaded document.

## Material infrastructure decisions

The PDF names **MongoDB**. The project is initialized with the web server enabled and the platform-managed database disabled so that this explicit database choice is not silently replaced. The planned backend reads an external MongoDB connection string from protected project configuration (`MONGODB_URI`); no credential will be placed in code, chat, logs, or Git. This means a real MongoDB URI must be supplied through the secure secret-input flow before persistent data operations can run.

**Vercel is required for the production website URL.** The intended release flow is a private GitHub repository connected to a Vercel project with production/preview deployments on pushes. The Vercel connector is authenticated and lists six existing projects, but the projects' returned team ID (`team_PI2fDnAMIB4wf8Dekg9QdaH5`) returned HTTP 403 when queried; the connector instructed that its single-use team-consent flow must be approved before team-scoped creation/configuration. GitHub CLI is authenticated. Do not switch hosts or create team-scoped resources until that Vercel access is granted. Manus Preview remains a development surface only; it is not the production deliverable.

## Implementation architecture

- **Frontend:** React + TypeScript + Vite, with a responsive application shell. Desktop uses the PDF's persistent left navigation and compact top bar; mobile collapses navigation into a drawer/bottom navigation. Feature areas: dashboard, vehicles, vehicle detail, service records, expenses, documents/insurance, reminders, reports, profile/settings, support, and admin.
- **Backend:** Node.js + Express + TypeScript API using Vercel Node Functions. Expose API routes under `/api`; keep the built Vite client as static output with SPA fallback that does not mask API errors. Validate request bodies and parameters with shared schemas; apply authentication, per-user ownership checks, safe pagination, and consistent error responses at the server boundary.
- **Identity and sessions:** The PDF's email/password fields, registration, and forgot-password path are explicit, so use a dedicated email/password flow rather than substituting a different login screen. Hash passwords with a maintained password-hashing library; persist opaque sessions in MongoDB and use an application-specific signing secret with `HttpOnly`, `Secure`, `SameSite=None` cookies for embedded HTTPS Preview. Add CSRF protections, login/reset rate limits, atomic single-use expiring reset tokens, and generic reset responses to prevent account enumeration. Account recovery email delivery needs a provider credential supplied through the secure secret flow; until configured, the UI must clearly report that delivery is not configured rather than claiming an email was sent. Public registration always grants the normal role. An administrator role is provisioned out-of-band only after mailbox ownership is independently verified, and every protected administrator request rechecks the current server-side email allowlist. The sign-in email is displayed read-only until a separate verified-email change flow exists.
- **Database:** MongoDB with Mongoose schemas/indexes for users, sessions, vehicles, service records, expenses, document metadata, reminders, feedback/support, and (if useful) saved insight summaries. Include ownership fields, timestamps, validation, unique indexes, and additive versioned initialization. Store uploaded bytes in a **private Vercel Blob** store and file metadata/ownership in MongoDB; authorize upload and short-lived download links on the server. Keep `BLOB_READ_WRITE_TOKEN` encrypted and server-only in each intended Vercel environment; never make user documents public.
- **AI:** The Vercel-hosted API calls **Vercel AI Gateway** using the deployment's OIDC token where available, with a protected `AI_GATEWAY_API_KEY` only for environments that need a static development credential. Require an explicit `AI_MODEL`; before advertising AI as ready or sending an inference, check the authenticated Gateway model catalog and require an eligible language model for HTTP requests. Send only the current user's relevant, minimized record summaries; validate output, handle empty/error responses, and provide a non-AI fallback summary. No model/API credential is exposed to browser code.
- **Security:** Helmet with iframe-compatible policy for Preview, secure session handling, CSRF protection, strict input validation, rate limits on authentication/AI/upload endpoints, safe file type/size checks, access-control tests, secrets via protected config, and no cross-user data access. Service dates cannot be future dates when interpreted in the submitting browser's IANA timezone; server validation applies on create and edit. Use audit-friendly server logs without passwords, tokens, document contents, or secret values.
- **Runtime and publication:** Vite builds to static assets; Vercel serves the frontend and Node API functions from the same origin. Use Vercel rewrites only to provide SPA route fallback, leaving `/api/*` to the API. Add a health endpoint and build/runtime configuration. Request one daily reminder job at 08:00 India time; email delivery remains unavailable until sender credentials and Cron authorization are configured. Keep in-app reminders usable and state setup limits clearly. Keep browser API URLs relative. Configure production and preview secrets through protected setup, deploy to Vercel, then check build logs and live application behavior. Never claim a live URL until Vercel confirms the deployment is ready.
- **Development:** Use Manus-managed Preview to iterate before deployment. Avoid writing test records to production MongoDB; run tests against an isolated test database or mock/repository boundary, not a shared production database.

## Proposed design direction

The provided sketches are the source of truth for information architecture (left-side navigation, dashboard cards, vehicle list/detail, service/expense tables, reminders, and profile tabs); they do not specify a finished color system. Three low-prior alternatives considered: (1) graphite-and-petrol “workshop console” (0.08); (2) warm ivory-and-copper “maintenance ledger” (0.06); (3) deep-indigo “fleet operations” (0.04). **Proposed choice: graphite-and-petrol workshop console.**

- **Design movement:** Contemporary industrial software, borrowing the clarity of a well-organized workshop instrument panel rather than automotive advertising.
- **Core principles:** Prioritize due dates; make cost and vehicle context legible at a glance; keep forms calm and short; make every action and AI claim traceable to stored records.
- **Color philosophy:** Quiet graphite/stone surfaces reduce visual fatigue; a distinctive petrol-teal signals trusted actions and healthy status; amber is reserved for approaching renewals and red for overdue items.
- **Layout paradigm:** A narrow persistent desktop navigation rail beside a broad, scrollable work area; dashboard content is arranged as a left-to-right operational narrative (status → upcoming work → spending/insight), not a generic centered landing-page grid. On mobile, the rail becomes a compact navigation drawer.
- **Signature elements:** A thin mileage/service timeline on vehicle details; clear date chips for service/renewal urgency; one persistent, labeled AI Assistant column/panel that can collapse on small screens.
- **Interaction philosophy:** Inline filtering and quick actions from lists; destructive actions require an explicit in-context confirmation; show save/upload progress and useful empty/error states; date and currency are consistently formatted.
- **Animation:** Brief, restrained transitions for navigation, panel expansion, and save feedback; no decorative looping motion; honor reduced-motion preferences.
- **Typography system:** Inter for application/UI text and IBM Plex Mono for odometer, cost, registration, and date values; use a compact, consistent heading/body/label scale with tabular numerals for financial and vehicle data.
- **Brand essence:** A dependable maintenance log for vehicle owners who want to prevent missed service and understand lifetime costs; practical, calm, accountable.
- **Brand voice:** Direct and helpful, never alarmist. Examples: “Two renewals are coming up this month.” “This estimate uses your last four service records.”
- **Wordmark & logo:** A simple custom line mark combining a service-book spine and a short road/mileage trace, paired with a restrained wordmark; no stock car imagery.
- **Signature brand color:** Petrol teal.

## Project structure

```text
vehicledesk/
├── src/                     # React entry, app routes, reusable UI, feature screens, styles
├── api/index.ts             # Vercel function wrapper for the Express API
├── server/                  # Express app/dev host, auth/session middleware, routes, Mongo models
├── shared/                  # Zod request schemas and shared domain types
├── public/                  # Static assets and /manus-routes.json
├── notes/                   # External platform facts and source links used during implementation
├── vercel.json              # Vercel routing, function, and permitted cron configuration
├── plan.md                  # This approved architecture/design plan
├── TODO.md                  # Full outcome requirements and progress after approval
```

## Dependencies and open setup inputs

The implementation depends on a protected MongoDB URI and session-signing secret. Real password-reset email delivery requires a configured email provider and its protected credential; the admin allowlist also needs secure setup. Private Vercel Blob requires a project-linked private store and encrypted `BLOB_READ_WRITE_TOKEN` in each environment that accepts uploads. Vercel AI Gateway uses deployment OIDC when available; otherwise configure a protected Gateway key and an explicit model ID that passes the authenticated eligibility check. Never put credentials in source or Git. Vercel returned existing user projects despite an empty team-list result; verify team ownership/permission before creating the new Vercel project. Configure production and Preview values intentionally and leave functionality clearly unconfigured until its required integration is ready.
