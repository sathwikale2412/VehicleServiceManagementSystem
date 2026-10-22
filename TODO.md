# Vehicle Service Record Management System — TODO

This list preserves the requested product behavior. Items remain open until the outcome is implemented and verified.

**Progress evidence:** strict TypeScript plus the production Vite build pass; all 40 unit and mocked-API tests pass across six suites. After the final backend hardening changes, Preview API health and setup status return HTTP 200 and the complete 17-route manifest is served. Product outcomes remain open until protected MongoDB, session, email, private Blob, AI/admin settings and Vercel/GitHub permissions are configured and verified. Tests do not use or mutate production data.

## Account registration, login, and recovery
- [ ] **Users can create and access their accounts securely.** Provide registration and login using the specification's email and password fields, a forgot-password path, and account creation. Store passwords only as strong one-way hashes; protect sessions and account-recovery tokens; rate-limit sensitive endpoints; return generic account-recovery responses that do not disclose whether an email exists. Do not claim an email reset was sent unless an email provider is configured and delivery is actually attempted. Prevent self-registration from assigning administrator privileges.

## Shared application shell and dashboard
- [ ] **The application is usable across device sizes and exposes the specified sections.** Provide a secure, user-friendly interface for users and administrators. Include navigation for Dashboard, My Vehicles, Service Records, Expenses, Reminders, Reports, Profile, and Logout, with the AI Assistant included as a distinct visible column/section. Preserve clear navigation on mobile-sized screens.
- [ ] **Dashboard gives an up-to-date overview.** Show today's live date and time; vehicle count; upcoming services; total expenses; reminders; a compact upcoming-service list with vehicle/service/date/status; and recent records or actions. The live clock updates while the dashboard remains open and uses the browser's local timezone.

## Vehicle records and detail
- [ ] **Users can maintain their vehicle inventory.** Provide Add Vehicle and My Vehicles pages. Each vehicle belongs to its owner and can be created, viewed, edited, and removed with confirmation. Vehicle cards show identifying information and active status and provide View Details navigation.
- [ ] **Vehicle detail consolidates the vehicle's records.** Show the vehicle identity and relevant specifications (registration, make/model, year, fuel type, purchase/registration dates, odometer, insurance/PUCC information and expiry when present). Provide actions to add a service record, add an expense, upload a document, and set a reminder. Show an overview, service-history timeline, expenses, and documents associated with that vehicle.

## Service history
- [ ] **Users can record and review service history.** Add, edit, view, and remove service records for an owned vehicle. A record includes service date, service type/name, odometer reading, cost, and other relevant notes; lists expose date/service/vehicle/odometer/cost/actions and sort/filter usefully. Show the total service cost and chronological history. Reject invalid or future service dates, negative costs, and readings inconsistent with validation rules.

## Expense tracking and analytics
- [ ] **Users can track maintenance expenses and see totals.** Record vehicle-linked expenses with date, category, description, and amount. Show total expenses, this-month and this-year totals, category breakdown, and recent expenses. Support the categories reflected in the reference (including service, fuel, repair, insurance, and other) and provide useful period/category filters. Use INR as the initial display currency based on the reference illustrations.

## Insurance and document management
- [ ] **Users can keep vehicle documents and renewal data together.** Support insurance and pollution/PUCC documentation plus other relevant vehicle documents. Upload documents, store durable object references and document metadata with vehicle ownership, show expiry/renewal dates and status, and provide authorized viewing/download. Validate file size/type and do not expose one user's documents to another user. A document metadata soft-delete must not be described as physically erasing bytes unless the storage service provides that capability.

## Reminder management
- [ ] **Users can see upcoming services and document renewals.** Provide a Reminder Management page for insurance renewal, pollution certificate renewal, and general service reminders. Each reminder identifies the relevant vehicle/type, due date, time remaining/status, and a way to view all reminders. Surface upcoming items in dashboard summaries and show overdue versus upcoming states. Provide a reminder-creation flow and allow updating/dismissing reminders. Do not claim scheduled email delivery until its provider/scheduler is configured; in-app reminders remain usable.

## Reports and maintenance planning
- [ ] **Users can generate useful maintenance reports and analytics.** Provide Reports & Analytics based on stored service history and expenses, including spending by period/category and maintenance history that supports better maintenance planning. Keep calculations consistent with the underlying user-owned records and allow useful date/vehicle filters.

## User profile and settings
- [ ] **Users can manage their profile.** Provide Profile/Settings with editable full name, phone, and address; display the registered sign-in email read-only because changing an account identifier requires a separate verified-email flow. Provide secure save behavior and account settings. Do not expose another user's profile data.

## Administrator dashboard and feedback/support
- [ ] **Administrators can perform the specified administration work safely.** Provide an Admin Dashboard distinct from normal user areas; enforce the admin role on the server and configure who is an admin through a secure allowlist, never a self-selected role. Limit access to necessary user/support management and aggregate operational information; retain ownership checks for private documents and records.
- [ ] **Users can submit and review feedback/support requests.** Provide a feedback/support area, persist submissions against the authenticated user, and provide a safe status/response path for support without exposing other users' requests.

## AI Assistant and insights
- [ ] **The AI Assistant section provides relevant insights from real user data.** Offer on-demand maintenance and expense insights grounded only in the signed-in user's relevant, minimized vehicle/service/expense/reminder records. Identify the records or date range supporting an insight, handle empty data and upstream failures gracefully, validate returned content, and clearly present generated advice as informational rather than professional mechanical or insurance advice. Keep platform AI credentials server-side and never expose them in browser code. Require an explicit `AI_MODEL` and show AI as ready only after the authenticated Gateway catalog confirms that model is an eligible language model for HTTP inference.

## Backend, privacy, security, and persistence
- [ ] **Application data persists in MongoDB and is isolated by account.** Use the requested MongoDB technology through a protected connection value; persist users, sessions, vehicles, service records, expenses, document metadata, reminders, feedback/support, and related records with ownership fields, timestamps, indexes, and deterministic initialization. Every API read, write, upload, and download enforces authenticated ownership on the server.
- [ ] **The server and uploaded files are protected.** Validate inputs and file metadata; limit upload size/type and sensitive endpoint rates; use secure session cookies, CSRF defenses, safe response headers compatible with the embedded Preview, non-leaking error messages, and logs that omit passwords/tokens/document contents/secrets. Never commit connection strings, session secrets, provider API keys, or real private data.
- [ ] **Required integrations are explicit and safely configured.** MongoDB URI, session secret, admin allowlist, email delivery credentials, private Blob token, and AI Gateway credentials plus an eligible model ID are supplied only through protected setup; production and preview Vercel environment scopes are configured intentionally. Missing or ineligible setup must be visible as an actionable unavailable state, not disguised as success.

## AI, verification, and live deployment
- [ ] **The implementation is built and checked before release.** Maintain readable separated frontend/backend/shared modules, route manifest, lockfile and deployment config. Run dependency install, language diagnostics, production build, relevant unit/integration checks (including account isolation, auth/session, validation, upload ownership, dashboard clock, expense/report aggregation, AI failure handling, and reminders), and deployment verification. Do not seed or mutate real production user data as a test.
- [ ] **The finished application is live on Vercel at a public URL.** Connect the project to the user's GitHub account using a private repository unless the user requests otherwise, configure Vercel for the real production frontend/API and required runtime environment values without committing secrets, confirm the Vercel build/deployment reaches READY, then smoke-check the live URL and core anonymous/authenticated flows using safe test data. Do not call Manus Preview the production URL and do not claim a live URL until Vercel confirms success.
