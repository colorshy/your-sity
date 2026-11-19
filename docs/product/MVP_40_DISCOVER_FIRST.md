# MVP 4.0 — Discover-first homepage

Source repository `colorshy/your-sity`, from `feat/mvp-34-product-experience` at `b8984213c7da65f67691ce01168b2d1666aa739a`. The working branch is `feat/mvp-4-discover-first`.

## Homepage correction

The public root now uses the original city-feed structure with a compact welcome, account links, and the real communities link. Guests see labeled, read-only fictional posts drawn from the existing demo. The root checks the server session before sending signed-in visitors to the real feed.

## Original MVP 4.0 delivery

- `/` presents Shymkent, people, communities, and the planned activities direction in Kazakh and Russian. Its catalog themes are illustrative. It works without Appwrite and checks only the current session, when present, before offering the Discover link. The public language switch updates the browser preference without a database write.
- `/demo` contains the fictional experience and browser-local activity. The real account forms use the existing Appwrite account/session workflow, server validation, generic credential feedback, and existing auth Firewall enforcement.
- Signup leads to onboarding, where the resident chooses language, Shymkent, and optional communities. Onboarding opens the existing feed, which links directly to Discover. Direct login opens the feed, and login from Discover resumes Discover via a fixed local destination.
- `/discover` checks the Appwrite session and onboarding state. It reads the Shymkent community catalog and the current resident’s memberships through the existing service. It links to community details, the searchable category catalog, the feed, the composer, and the profile.
- If signup creates an Appwrite account but a later session/profile step fails, the account may already exist. The resident can retry via sign-in, which uses the existing profile creation/recovery flow. The UI reports success only after a verified session and profile setup.

## Local preview

Install dependencies with `npm ci`, run `npm run dev`, and open `http://localhost:3000`. With no Appwrite environment configured, the homepage and demo are available and the account forms show service unavailability. For end-to-end account and Discover checks against the local SDK fixture, run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Omit the executable override when using Playwright-managed Chromium. The suite exercises the anonymous homepage, language preference, 320 px and 390 px widths plus tablet and desktop, account forms, session/logout, onboarding, and Appwrite-fixture-backed Discover. Landing screenshots are written to Playwright’s `test-results` directory.

## Hosted acceptance

The local Appwrite SDK fixture exercises application behavior. Hosted acceptance still requires verified live Vercel auth/write Firewall rules, a protected Preview tied to the exact release commit, and authorized two-user Appwrite signup/session/social testing, including verification. The Appwrite project’s Frankfurt region also requires legal and architectural review for Kazakhstan personal data. The previous Preview belongs to the earlier milestone. See [MVP 3.5 live acceptance](MVP_35_LIVE_ACCEPTANCE.md) for the existing gates.

## Files changed

- Public homepage and shared presentation — `src/app/page.tsx`, `src/components/public/header.tsx`, `src/components/public/public.module.css`.
- Discover and navigation — `src/app/discover/page.tsx`, `src/app/feed/page.tsx`, `src/components/backend/shell.tsx`.
- Account entry and server protections — `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, `src/app/actions.ts`, `src/components/backend/auth-page.tsx`, `src/components/backend/submit.tsx`, `src/lib/auth.ts`, `src/lib/operations/abuse.ts`, `src/proxy.ts`.
- Browser verification — `tests/discover.spec.ts`, `tests/demo.spec.ts`, `tests/social-mvp.spec.ts`, `tests/visible-mvp.spec.ts`.
- Product notes — this document and `docs/progress.md`.
