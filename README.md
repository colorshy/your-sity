# Your City — Appwrite application

Next.js, TypeScript and Tailwind community application for Shymkent, with Kazakh/Russian UI. This feature branch reuses the existing app and implements Appwrite Auth, onboarding, membership, feed, post/comment CRUD, reporting and a moderator queue.

**Verification boundary:** the founder reports that ChatGPT provisioned the real Appwrite backend in its separately connected integration. Codex has no Appwrite MCP/session key here and does not claim that the actual schema/permissions match the app yet. Local tests use an SDK-compatible loopback fixture. Coordinate live compatibility through [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md); do not recreate resources.

## Runtime

Node >=22.19 (validated/pinned in .nvmrc: 24.22.1), npm 11.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Configure the variables in `.env.example` through secure environment settings or merge them into ignored `.env.local` without overwriting existing local configuration. APPWRITE_API_KEY is **server-only** and never NEXT_PUBLIC. No passwords or session secrets are stored in application tables. No Supabase dependency/fallback remains in the runtime; old experimental SQL is archived in docs/legacy-supabase and must not be applied to Appwrite.

Fixed defaults: endpoint https://fra.cloud.appwrite.io/v1, project your-city, database your_city_db. The existing shymkent and seven community IDs are reused exactly. The coordinated backend operator provisions application secrets, Web platform/verification hostname, column/index compatibility and permissions; no founder table/ID copying is required.

## Application

- `/sign-up`, `/sign-in`: email/password Auth; HttpOnly persistent session; `/profile`: logout and email verification request.
- `/onboarding`: name, kk/ru preference, Shymkent and selected communities saved transactionally.
- `/communities`: city discovery/search; join/leave; `/communities/<id>`: paginated community feed.
- `/feed`: joined-community or broader city posts, newest-first and paginated.
- `/create`, `/posts/<id>`: create/edit/soft-delete own posts and comments; report a post.
- `/moderation`: trusted moderator report queue and hide/dismiss decisions. IDs come only from server configuration.
- `/demo`: explicitly fictional isolated UI demonstration; never a fallback for missing/failed backend data.

Server actions independently verify identity, bound input and ownership/membership/city. Appwrite data writes are server-only; a metadata gate rejects unsafe table policies and incompatible schema. Existing private profiles are not exposed: author lists contain display name/ID only. Empty/loading/error states and pending forms are provided. Language is retained in profile and cookie. City changes after onboarding require a separate administrative workflow. Content deletion redacts the body and marks deleted; records are retained for moderation consistency.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npm run test:security
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Browser tests start only a loopback Appwrite fixture on 54321 and Next on 3100; all real project settings are overridden. A single worker avoids fixture transaction interference. They test session persistence, onboarding, membership and content CRUD on desktop/tablet/mobile. Security tests use an in-memory repository and SDK transaction stub: negative ownership/city/member checks, schema/permission rejection and moderator trust. They **do not** validate actual Appwrite permission enforcement.

Stop only a dev server you started before browser tests; Next allows one dev server per checkout. Elsewhere install Playwright Chromium or use a verified installed browser path. `npm run appwrite:inspect` is read-only and optional for an authorized backend operator; it is not part of installation and is not repeatedly retried in this MCP-less session.

See docs/architecture.md, docs/database.md, docs/progress.md and BACKEND_REQUIREMENTS.md. Passing tests/pushing Git is not a production deployment or Codex environment publication.
