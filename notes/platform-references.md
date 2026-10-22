# Platform implementation references

Collected from the authenticated Vercel MCP documentation search on 2026-10-23.

- **Vercel Node.js functions and rewrites:** Vercel rewrites can route incoming API paths to a serverless function while preserving static files; keep API routing before the SPA fallback. Source: https://vercel.com/docs/rewrites
- **Vercel Cron security:** scheduled functions should verify `Authorization: Bearer <CRON_SECRET>`; source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- **Vercel AI Gateway:** OpenAI-compatible requests can target `https://ai-gateway.vercel.sh/v1`; documentation describes API-key or Vercel OIDC authentication. OIDC at runtime may be provided through the request header; production OIDC access must be enabled/configured. Source: https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication
- **Private Vercel Blob:** private file access requires authenticated requests; Vercel Functions can use OIDC credentials or a private Blob token. Short-lived presigned GET URLs can be issued for authorized downloads. Source: https://vercel.com/docs/vercel-blob/private-storage and https://vercel.com/docs/vercel-blob/vercel-signed-urls
- **Vercel connector authorization:** a `get_team` request for the project list's team returned HTTP 403 and identified team ID `team_PI2fDnAMIB4wf8Dekg9QdaH5`; the response instructed use of `authorize_team_access`, followed by user consent, before retrying team-scoped actions.
