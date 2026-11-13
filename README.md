# Your City — Шымкент рядом

A responsive city social platform for Shymkent, built on the existing Next.js, TypeScript and Tailwind application. Open `/` to explore the visual MVP immediately, without an account or backend credentials. Russian/Kazakh UI, light/dark themes, local images, eight fictional city stories and seven communities are included. Existing Appwrite Auth, onboarding, membership, feed, post/comment CRUD, reporting and moderation remain available through the real account routes.

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
- `/` and `/demo`: openly labeled demo feed with search, type/district filters and three feed tabs.
- `/demo?page=communities`, `/demo?page=community&id=<id>`: browse/search seven communities, join/leave locally. Use `/demo?page=community&id=<id>` for direct community links.
- `/demo?page=create`, `?page=post&id=<id>`: create a local post with a gallery cover, open posts, like/save/share and add/remove local comments.
- `/demo?page=profile`, `?page=saved`: edit demo name/bio/avatar, view own posts and bookmarks.

Demo changes persist under the versioned `your-city-demo-v2` localStorage key, independently of real accounts. If browser storage is denied, interactions use session memory with an explicit warning. User-written content stays in its original language. Locally created post links work only in the browser that contains them; missing posts show a helpful recovery link. No demo action sends data to Appwrite. Profiles, activity counts and sample comments are fictional and labeled; a failed live backend never silently substitutes demo posts into real feeds. Media sources are documented in public/demo/ATTRIBUTION.md.

Server actions independently verify identity, bound input and ownership/membership/city. Appwrite data writes are server-only; a metadata gate rejects unsafe table policies and incompatible schema. Existing private profiles are not exposed: author lists contain display name/ID only. Empty/loading/error states and pending forms are provided. Language is retained in profile and cookie. City changes after onboarding require a separate administrative workflow. Content deletion redacts the body and marks deleted; records are retained for moderation consistency.

## Your City 2.0 social demo

The public demo now has three feed tabs: **For You / Для тебя / Сіз үшін**, **City / Город / Қала**, and **Communities / Сообщества / Қауымдастықтар**. For You uses joined communities, followed demo accounts, recency and actual interactions in this browser. City is chronological with news/question/discussion/event/marketplace filters. No seed popularity numbers or AI recommendation claims are used. Community discovery remains one click away.

- Post cards include linked profiles, usernames, dated sample timestamps, community/district tags, expandable text, images, local likes, replies, quotes, bookmarks and share links.
- Threaded replies keep a simple visual hierarchy, including on phones. You can reply to a person, edit/delete your own demo comments and keep replies to a removed parent via a tombstone. Sample comments cannot be edited as your own.
- Profiles support cover/avatar/name/username/bio, local follow/unfollow, Posts/Replies/Media/Likes tabs and a keyboard-accessible native edit dialog. Follow counters start at zero and represent only connections in this browser.
- `/demo?page=notifications` records local reply/like/follow/community actions and persists read/unread state. Optional incoming-style samples are added only by the **Add sample events** control and labeled explicitly. No real person is notified.
- Report controls store a **local demo report**, not a submission to moderation. Mute/block affect your demo feeds; restore accounts from your own profile's hidden-account disclosure.

Optional location tags use the five administrative districts of Shymkent: Abay, Al-Farabi, Enbekshi, Karatau and Turan. These are broad districts, not verified addresses of sample authors. `src/lib/city-data.ts` holds bilingual names and the city authority reference; no GPS/location permission is requested. The catalog is the extension point for another city's districts. Seed stories have fixed sample dates, not a claim of live news.

Existing local demo data is migrated additively under the same storage key. Comments, follows, notifications and reports are local frontend functionality and do **not** synchronize across real accounts or browsers. Real Appwrite routes retain their existing security and behavior. No infrastructure or database changes are required for this demo upgrade.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npm run test:security
npm run test:social
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Browser tests start only a loopback Appwrite fixture on 54321 and Next on 3100; all real project settings are overridden. A single worker avoids fixture transaction interference. They test session persistence, onboarding, membership and content CRUD on desktop/tablet/mobile, plus the public MVP navigation, search/filters/sorting, membership persistence, local profile/post/comment interactions, bookmarks, clipboard sharing, themes/localization and 320px/storage-denied behavior. Security tests use an in-memory repository and SDK transaction stub: negative ownership/city/member checks, schema/permission rejection and moderator trust. They **do not** validate actual Appwrite permission enforcement.

Stop only a dev server you started before browser tests; Next allows one dev server per checkout. Elsewhere install Playwright Chromium or use a verified installed browser path. `npm run appwrite:inspect` is read-only and optional for an authorized backend operator; it is not part of installation and is not repeatedly retried in this MCP-less session.

See docs/architecture.md, docs/database.md, docs/progress.md and BACKEND_REQUIREMENTS.md. Passing tests/pushing Git is not a production deployment or Codex environment publication.

## Milestone 4 launch candidate

Production launch is pending external access, not declared complete. See [launch runbook](docs/launch-runbook.md) for exact evidence and the safe Vercel release sequence. Vercel config targets Next.js/Node 24 in Frankfurt and keeps automatic Git deployments disabled until live acceptance. Preview origin may use trusted Vercel deployment metadata; Production requires its explicit HTTPS canonical URL.

New checks: `npm run test:operations`, `npm run launch:preflight`, and `LIVE_BASE_URL=<verified HTTPS origin> npm run launch:smoke`. Preflight/smoke return exit 2 when prerequisites are missing. The Vercel auth/write Firewall rule IDs in .env.example are required in Production/Preview runtime; missing/not-found/unavailable rules deny writes rather than bypass protection. Logout remains available. /api/health is liveness; /api/ready is a minimal backend/configuration readiness signal, not full live acceptance. Neither endpoint exposes credentials or records. Existing fixture tests remain explicitly local.
