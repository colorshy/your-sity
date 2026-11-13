# Your City

Shymkent city communities using Next.js App Router, TypeScript, Tailwind and Supabase SSR.
Milestone 3 code is implemented; hosted Supabase migration/application verification remains blocked by network and migration access. See docs/progress.md for exact evidence.

## Development

Node 22+ (validated 24.22.1), npm 11:

```sh
npm ci --cache /workspace/.npm-cache
cp .env.example .env.local
# Fill public URL/publishable key and your canonical application origin securely.
npm run dev
```

Real routes: `/sign-up`, `/sign-in`, `/onboarding`, `/communities`, `/communities/<uuid>`, `/feed`, `/profile`. Unauthenticated users are redirected to sign-in; onboarded residents access their selected city's data. Missing configuration displays a service-unavailable screen. `/demo` and `/demo?page=communities` are explicitly fictional, isolated demos. Live pages never fall back to fixture posts. Posting/comment/report UI is a later milestone; table policies already enforce access.

## Supabase setup

1. Enable network access to your exact project hostname. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` in environment settings; local `.env.local` is ignored. No service-role key is needed by the app.
2. Use authorized SQL/CLI access to inspect `supabase/preflight.sql` results and existing migration history. Do not run migrations against unknown/conflicting tables. See [database](docs/database.md).
3. Apply `supabase/migrations/202611130001_foundation.sql` once through reviewed migration tooling. The transaction fails on conflicting objects rather than deleting/replacing existing tables.
4. Enable email/password Auth and email confirmation. Set Auth Site URL to your canonical application origin and allow its `/auth/callback` URL. PKCE callback exchanges the code and stores cookies; it must open in the browser that initiated signup. For token-hash confirmation templates, use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (supports a different browser). Configure email delivery limits/SMTP as appropriate.
5. Verify signup, actual email delivery, confirmation, login, reload, onboarding, membership and logout against a disposable authorized test account. Local fixture tests do not establish hosted integration success.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npm run test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Stop only a development server you started before running browser tests: Next.js allows one dev process per checkout. Tests launch a loopback Auth/REST fixture on 54321 and Next on 3100, overriding actual project variables. Browser tests verify SSR flows against the **fixture**, not the real project. Database tests execute migration SQL and RLS in embedded PostgreSQL (PGlite), with a minimal Auth schema/role shim. Hosted migration verification and real multi-user tests are separate requirements. On another machine install Chromium with `npx playwright install chromium` or set an installed Chromium path.

See [architecture](docs/architecture.md), [database](docs/database.md), [progress](docs/progress.md), and [deployment](docs/deployment.md). No cloud publication or Vercel deployment is implied by passing tests.
