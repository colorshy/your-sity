# Cloud development and deployment

## Reproducibility

GitHub repository: colorshy/your-sity. Use existing cloud checkout, Node 22+ and npm ci; package-lock.json pins dependencies. No laptop-specific paths or credentials. Do not assume running servers survive cloud snapshots.

## Future Supabase setup (milestone 3)

Create a Supabase project and keep URL + publishable key in environment settings, using names from .env.example. Public publishable keys are safe only with tested RLS. Never expose service-role/database passwords. Implement and apply reviewed migrations before enabling real writes. Configure Auth site URL and callback allowlist for local/staging/production. No secret values in chat or repository.

## Vercel

Import the GitHub repository, choose Next.js and Node 24, build with npm run build. Add future Supabase variables to scoped environment settings and configure Auth redirects. Deploy a preview, then verify route rendering, auth and RLS before production promotion. No Vercel project was created and no deployment or cloud synchronization is claimed here.

## GitHub

Files remain in the local cloud checkout until committed and pushed. Review git diff and status before publishing. No automatic push is required for demo validation.

## Milestone 3 update

The SSR/database foundation is implemented on feat/milestone-3-supabase. Follow the current README and database guide for preflight, migration and email confirmation. Set NEXT_PUBLIC_SITE_URL to the canonical deployed origin; do not use localhost in a production deployment. Apply the exact project-host network setting and provide authorized migration access before claiming hosted readiness. The app never needs a service-role key. Browser fixture tests and local PostgreSQL RLS tests do not replace hosted Auth/email/RLS verification.
