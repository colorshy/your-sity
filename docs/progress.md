# Progress — 2026-11-13

Current direction: **Appwrite continuation**; see the latest section below and BACKEND_REQUIREMENTS.md. Earlier Supabase entries are historical.

## Milestone 1 — foundation implemented

- Inspected the existing checkout: empty, no commits or remote branches; preserved Git configuration.
- Created Next.js App Router, strict TypeScript, React, Tailwind 4, Lucide and Supabase dependency foundation; pinned resolved dependencies in package-lock.json.
- Added environment template, ignored secrets/generated files, ESLint, formatting, cloud instructions, architecture, database plan and deployment roadmap.
- Initial npm cache failed because home paths are unavailable; installation succeeded with /workspace/.npm-cache. No verification bypasses.
- Validation: dependency installation, lint, typecheck and production build passed after fixes. Clean reinstall and final checks recorded below.

## Milestone 2 — demo interface implemented

- Kazakh/Russian landing, feed, discovery, community detail, profile, auth/onboarding/create layouts, loading, empty, error and not-found states.
- Seven demo communities, three explicitly fictional sample posts; no invented live activity.
- Working demo search, membership toggles, feed filtering, locale persistence, responsive sidebar/mobile navigation. Membership is transient within the page.
- Auth/publishing controls intentionally disabled and explained; no backend authorization claim.
- Browser checks cover search/empty results, membership join/leave, feed filtering, language persistence, document language, route rendering, missing-community UI, disabled auth and horizontal overflow.
- Initial browser runs failed: clicks before hydration, development-origin configuration and expecting HTTP 404 after streaming started. Added readiness/inert behavior, allowed only loopback dev origin, and asserted rendered 404 UI for streamed routes. Subsequent desktop/mobile run: 6/6 passed.
- Browser download returned policy 403 for cdn.playwright.dev. Used existing /usr/bin/chromium successfully; no extra network access needed.
- Desktop screenshot inspected; final tablet and repeatability results below.

## Remaining scope

Milestones 3–6 not implemented: real Auth, session protection, migrations/RLS, persisted memberships, posts/comments/reporting/moderator actions, integration security tests and deployment.
No Supabase project or Vercel deployment configured. Git publication status is tracked in the verification section below. No cloud publication verified.

## Exact next session task

Implement milestone 3: typed kk/ru catalogs and feature components, Supabase SSR browser/server clients, versioned SQL migrations for all seven tables, trusted moderation roles, tested RLS, Auth sign-up/sign-in/sign-out/session refresh, protected server routes, profile and Shymkent onboarding. Require a configured Supabase project and public URL/publishable key in environment settings; never request secret values in chat. Verify access-denial tests before real writes.

## Final validation

- Frozen clean reinstall: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` passed (383 packages).
- `npm run lint`: passed, zero warnings/errors.
- `npm run typecheck`: passed.
- `npm run build`: passed, all listed routes generated/compiled.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`: **9 passed** across desktop, tablet and mobile. No remaining failed tests.
- Production server was started and /feed rendered in Chromium; demo feed interaction returned two joined-community posts. Desktop screenshot inspected.
- npm reports an upstream deprecation notice for ESLint 9, retained for compatibility with the chosen Next.js ESLint configuration; lint itself passes.
- Reusable environment draft saved: install_script and start_skill. Saving is confirmed; environment publication and restoration in a new task are not verified.

## Created files

- Root: package.json, package-lock.json, tsconfig.json, next-env.d.ts, next.config.ts, postcss.config.mjs, eslint.config.mjs, playwright.config.ts, .gitignore, .env.example, README.md, AGENTS.md.
- Routes: src/app/{page,layout,loading,error,not-found}.tsx, src/app/globals.css, src/app/{feed,communities,communities/[id],profile,sign-in,sign-up,onboarding,create,about}/page.tsx.
- UI/data: src/components/city-app.tsx, src/lib/demo.ts.
- Tests: tests/demo.spec.ts.
- Docs: architecture.md, database.md, development-roadmap.md, deployment.md, progress.md under docs/.

## Repository verification and publication — 2026-11-13

- Existing project inspected and preserved; Milestone 3 was not started. Initial Git state: unborn `work`, all project files untracked, origin `https://github.com/colorshy/your-sity.git`. Successful `git ls-remote --symref origin` advertised no branches, including no `main`.
- Development branch: `feat/milestones-1-2`. The remote has no base branch for a pull request; do not invent a PR or overwrite another branch.
- Ignore rules verified for `.env`, `.env.local`, `.env.production`, `.env.development.local`, node_modules, .next and test outputs. Only the blank `.env.example` is included. Common private-key, GitHub-token, Supabase-secret and JWT pattern scan found no matches in proposed project files.
- Fresh lint, typecheck and production build passed. Production `/feed` returned HTTP 200. Browser test startup initially failed because the prior session's dev server still held the checkout lock; stopped that identified server and reran the tests.
- Cloud runtime reports running/connected, current observations and enforced restricted network policy, no configured Supabase bindings. Saved draft revision 2 contains complete install_script (`npm ci`, lint, typecheck, build in `/workspace/your-sity`) and start_skill (dev server, local readiness check, system Chromium tests, restart instructions). Publication and fresh-task restoration remain unverified.
- GitHub API repository request via existing injected authentication returned `Forbidden`; no secret values were printed or copied. Git read access and API/write access are separate. Push/PR results are recorded after actual attempts below.

### Milestone 3 prerequisites

1. A Supabase development project and project-specific URL/host. Supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` securely in environment settings; retain `.env.example` without values.
2. Allow the exact Supabase project API hostname through the environment's restricted network policy. Any CLI/management/database migration destination must be identified and authorized for the selected migration method.
3. An authorized way to apply migrations: project-owner SQL Editor, or securely configured Supabase CLI/database connection. Never place service-role keys or database credentials in client code or Git.
4. Supabase email/password Auth enabled, site URL and redirect allowlist chosen for development and future Vercel URLs; decide whether email confirmation uses Supabase's development mail limits or configured SMTP.
5. A disposable test project/users and authorized test-only moderator provisioning for RLS/access-denial tests. Real authentication, writes and protected routes remain disabled until implementation and validation.
6. Vercel is optional for Milestone 3 local/cloud development; it is required only for deployment validation later.

- Verification rerun: lint, TypeScript, production build and all **9 browser tests passed** (desktop/tablet/mobile); no application source was changed in this verification task.

### Confirmed GitHub results

- Initial application commit: `104da6afa0dedf315a136b00a2b260a447d47485` (`feat: initialize Your City foundation and localized demo UI`).
- `git push -u origin feat/milestones-1-2` succeeded; a separate `git ls-remote --heads origin` returned that exact commit for the remote branch. Application code is saved to GitHub.
- `gh pr create --repo colorshy/your-sity --base main --head feat/milestones-1-2` failed: `POST https://api.github.com/graphql: Forbidden`. No PR was created. The remote currently has only the development branch and no `main` PR base.
- To unblock API access, review the environment GitHub connection permissions (repository contents and pull-request write access) and allow `api.github.com` in restricted network settings. Retry `gh api repos/colorshy/your-sity` and PR creation after saving settings. Do not replace working Git authentication or paste tokens into chat. The observed response does not identify whether API policy or authorization caused the denial.
- Establish the intended default/base-branch strategy for this initially empty repository before opening the initial-code PR; an unrelated README commit on main will not supply a common ancestor. No main branch, forced push, history rewrite or automatic merge was performed.
- The subsequent documentation-only commit records these confirmed results; its final hash is reported in the task response and can be read with `git log -1`.

## Milestone 3 — Supabase foundation implementation (2026-11-13)

The founder explicitly authorized starting Milestone 3 without waiting for cloud environment publication. Work is on `feat/milestone-3-supabase`, created from remote main at `766d49d1e3d356888d398e5ae036114fcdc9048d`; other branches and their publication reports are preserved.

Implemented SSR public/server client factories and Next.js 16 proxy cookie refresh; verified-user server guards; registration, sign-in/out, cookie session persistence, email verification via PKCE or token hash, generic errors and verification-email resend. Auth return URLs use the configured canonical origin and fixed local destinations. Onboarding atomically saves profile name, Shymkent and selected community memberships. Real community discovery/membership, city/joined-community feed queries and own profile use Supabase. Fictional posts exist only under /demo; live empty states show no fabricated activity.

Added `supabase/migrations/202611130001_foundation.sql`: seven public RLS tables, constraints/indexes, safe Auth-profile trigger, Shymkent/community category seeds, private moderator support and restricted onboarding RPC. No hosted database mutation has been performed. A read-only `supabase/preflight.sql` is provided to inspect actual schema, policies, triggers and migration history before applying anything. Conflicting objects cause transactional failure, not replacement.

### Connection evidence and blockers

- No Supabase connector/SQL-management tools were exposed in the active tool inventory; no injected Supabase/database variables existed initially. Founder supplied a project URL and publishable key, stored only in ignored `.env.local` with restricted permissions. No secret/service-role key is used by the application.
- Auth settings and REST cities probes to the supplied project failed at proxy CONNECT with 403 before reaching Supabase. A saved environment draft adds the exact project hostname and public-variable requirements; runtime verification still reports that hostname not allowed. Saving the draft does not apply it.
- The supplied PostgreSQL connection string contains a password placeholder and is not usable migration authorization. Supabase login/link commands alone do not supply a management token or database access. Existing hosted tables/migrations, email settings, hosted Auth success, hosted RLS and real-data persistence remain unverified.
- The canonical development origin is configured locally; hosted deployment must set its actual origin and Auth redirect allowlist. Email confirmation delivery must be tested using an authorized account. Keys are never committed.

### Validation

- Dependency installation succeeded; @supabase/ssr updated to 0.12.7 and PGlite added for local PostgreSQL tests.
- Migration and authorization tests: 19/19 passed on embedded PostgreSQL with a minimal auth schema/role shim, including anonymous/cross-user denial, membership/city checks, hidden data, moderator trust, owner deletion and collision rollback. This is local RLS evidence, not hosted Supabase verification.
- Browser suite uses an isolated loopback Auth/REST fixture; it never sends test credentials to the founder's project. Covers SSR sign-in/out, reload persistence, invalid login, email-confirmation state, token confirmation, guards, locale and demo isolation across three viewports.
- Initial browser startup was blocked by a dev server left from the prior task; only that identified server was stopped. Subsequent tests exposed a callback origin issue (fixed with canonical SITE_URL), ambiguous logout text (clarified), and a test selector that also matched Next's route announcer (scoped to the form panel).
- Final command results are recorded below after completion. No production deployment or real Supabase integration success is claimed.

### Exact next task

Save/apply the project-host network setting and secure environment variables. Obtain authorized SQL Editor/CLI access, inspect preflight results and existing migration history, reconcile any conflicts, then apply the migration once. Configure Supabase Auth site/redirect/email settings and verify two real test users: signup/confirmation/session, onboarding/membership persistence, cross-user/anonymous write denials and report privacy. Only after this hosted acceptance pass proceed to post/comment creation and moderation UI (next feature milestone).

### Final Milestone 3 validation result

- Dependency installation: passed. Lint: passed. TypeScript: passed. Production build: passed (14 application routes including Auth callbacks; SSR proxy compiled).
- Local PostgreSQL migration/RLS tests: **19 passed, 0 failed**.
- Browser tests: **21 passed, 0 failed** across desktop/tablet/mobile, using the documented local Auth/REST fixture. Sign-in, logout, reload persistence and email token confirmation were exercised; this does not prove hosted Auth/email delivery.
- Candidate-file credential scan found no keys/tokens; only the blank .env.example is tracked. Actual public project configuration stays in ignored .env.local/environment settings.
- Hosted migration verification, actual project login and hosted cross-user RLS checks: **not run / blocked**, not passed. No live user-generated data has been read or changed.
- Code and docs are ready for review; Milestone 3 is not declared fully integrated until hosted acceptance checks pass. The commit/push result and final SHA are reported in the task response.

## Milestone 3 — Appwrite continuation (2026-11-13)

The latest user explicitly selected Appwrite and assigned live backend configuration to ChatGPT's separate connected integration. This supersedes the earlier Supabase plan. Work continues on `feat/milestone-3-appwrite` from `697afb9eaec64d839b4f7679dee2a229035b887f`, preserving the existing SSR feature pages/design and all prior branches.

### Implemented application work

- Replaced Supabase runtime clients/dependencies with node-appwrite 31.2.0. Public defaults reuse Frankfurt endpoint, project your-city, database your_city_db and the exact existing Shymkent/community IDs. Historical SQL was archived under docs/legacy-supabase, never executed against Appwrite.
- Added Appwrite signup/login/logout, HttpOnly persistent sessions, Account.get identity validation on protected pages/actions and email verification support. Session secrets/passwords/API keys never go into app tables or client props. Profile initialization reuses existing user_id rows and is idempotent.
- Persisted transactional onboarding (name/city/communities/language), profile settings and localized cookie preference. Discovery/search, join/leave/rejoin, profile joined-community display, city vs joined feed and basic content pagination use Appwrite SDK operations.
- Added post/comment create/edit/redacting-soft-delete, visible moderation status behavior, reports and a server-provisioned moderator hide/dismiss queue. The server derives identity/status, validates text/IDs, enforces city+membership and ownership, and never accepts an editable user role as authority.
- Metadata/schema checks fail closed for unsafe direct-client table permissions, incompatible columns or missing unique profile/membership indexes. Transactions do not silently downgrade to unprotected writes. Existing rows with noncanonical profile/membership IDs are reused, not duplicated.
- Added precise BACKEND_REQUIREMENTS.md for ChatGPT: exact existing-resource operations, permission model, columns/aliases/capacity/enums, indexes, SDK scope operations, transaction support and live negative acceptance tests. The optional appwrite:inspect helper is read-only; there is no schema/table creation or permission mutation script in this branch.
- Node minimum is now >=22.19 due to current Undici; .nvmrc pins the validated 24.22.1. SDK transport respects inherited proxy/trust settings. No TLS/security bypass was used.

### Verification boundary and coordination

At first inspection this Codex session had no Appwrite MCP tools, no APPWRITE environment variables or server API key. One public metadata probe was blocked at proxy CONNECT (403), before project authorization could be tested. The user then explicitly confirmed that ChatGPT had verified/provisioned the backend elsewhere and instructed Codex to stop API retries/admin requests. No more live Appwrite probes or resource changes were performed. No live schema, table permissions, existing record data, account creation, or Appwrite authorization test is claimed by Codex.

Local SDK/browser fixtures are isolated on loopback; fake users/content exist only inside that test process. Production routes never fall back to demo/mock data. Actual backend compatibility and real project acceptance are ChatGPT's coordinated follow-up using BACKEND_REQUIREMENTS.md, not manual founder administration.

### Tests and fixes

- Dependency installation and a fresh lockfile update completed. No real secrets are included in repository candidates; .env.local remains ignored and preserved.
- Security/domain tests cover ownership, memberships, city boundaries, profile privacy, moderated content, reports/moderator trust, duplicate prevention, transactional rollback, schema/type/permission rejection and reuse of preexisting row IDs.
- Browser tests cover signup/onboarding/membership, login/reload/logout, localized UI, guards, demo isolation and full post/comment CRUD at desktop/tablet/mobile sizes.
- Initial iterations found an ambiguous test locator (text also existed in a hidden edit textarea), premature reload before membership mutation completed, and a loopback fixture parser that did not handle the SDK's indexed query-string serialization. Fixed selectors/waits and SDK-contract fixture parsing; no live API was retried to resolve these local failures.
- Final command results and GitHub publication status are recorded below after completion. Passing local tests is not live Appwrite integration or deployment success.

### Exact next coordinated task

ChatGPT should inspect/reconcile the actual backend against BACKEND_REQUIREMENTS.md, provision the scoped server configuration through secure settings, and execute the listed two-user live acceptance/negative tests. Return any actual schema differences for adapter reconciliation. Once live acceptance is verified, prepare a deployment preview with canonical host/cookie/email settings and abuse controls; extend pagination beyond initial community/membership bounds only as needed. Existing Codex environment publication is independent and is not a development gate.

### Final Appwrite local results

- `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`: clean locked dependency installation passed.
- `npm run lint`: passed with zero warnings/errors. `npm run typecheck`: passed. `npm run build`: passed, Appwrite application routes compiled.
- `npm run test:security`: **22 passed, 0 failed** (local domain/schema/SDK-transaction checks).
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`: **24 passed, 0 failed** across desktop, tablet and mobile, against the isolated Appwrite SDK fixture. No live Appwrite acceptance result is implied.
- No live Appwrite database/table/column/index/permission or row was created/modified by Codex. No deployment was triggered. The connected ChatGPT backend operator owns the precise follow-up in BACKEND_REQUIREMENTS.md.
- GitHub commit/push and any PR attempt are reported in the final task response. Existing main, milestone-1/2 and Supabase feature branches are preserved. Secrets remain outside Git.

## Milestone 4 — production launch candidate (2026-11-13)

Dedicated branch `feat/milestone-4-launch` starts from verified Appwrite commit `4ffe859e12fa16015893db7ee520014872f84c08`. No unrelated branch/default/history changes. Application architecture, backend contract, dependencies, environment files and existing tests were audited.

### Executed work

- Confirmed no Appwrite/Vercel tools, no injected server/token variables, no Vercel auth/project binding and no actual Appwrite key in local env names. HTTPS probes to both official services failed at cloud-proxy CONNECT (403), not an authenticated team/SSO response. No live resources were recreated or modified.
- Installed Vercel CLI 65.15.0 through npm exec. Corrected its global-config-directory failure using the supported flag. whoami reports Logged out. Ordinary dry inspection and temporary+dry both require login. Official login workflow and a supported Node inherited-proxy diagnostic retry fail before yielding an owner approval URL. No deployment/URL/account/team/project discovery was completed or falsely claimed.
- Saved exact official API host and secure credential requirements in the environment draft, preserving existing configuration. Runtime observations still show no secrets/variables/custom hosts; saved draft does not grant access. No secret values were printed, copied into Git or passed on a deployment command line.
- Added Vercel Next.js/Frankfurt/Node 24 configuration, explicit build dev dependencies, upload exclusions and disabled Git auto-deployment pending acceptance. A CI workflow runs local/fixture checks without deployment credentials; its remote execution is not assumed passed.
- Added production rate protection using official @vercel/firewall SDK, with fail-closed missing/not-found/blocked/timeout behavior and a platform-derived destination host. Logout intentionally remains available. Actual project-level rules require authorized Vercel setup and live verification.
- Added HTTPS canonical-origin validation and trusted Preview metadata fallback; minimal health/readiness endpoints; safe enumerated JSON logs; backend error sanitization; security response headers; non-deploying preflight/read-only live smoke tools.
- Added docs/launch-runbook.md and docs/launch-status.md with exact release sequence, blockers and no-duplicate-project/no-unverified-promotion constraints. Updated backend handoff and env template. The next step is external authorization, not routine founder engineering.

### Verification and remaining scope

Local production server returned /api/health HTTP 200 and /api/ready HTTP 503 with missing configuration, with expected no-store/security headers and no credential details. Production refusal is expected and not a live readiness success. Launch preflight/live smoke exit 2 as blocked; no real Auth, two-user ownership, Appwrite permission, actual Firewall or deployed responsive test has run. Full command totals are appended after completion.

Milestone 4 remains **incomplete** until a real preview URL, real backend acceptance and safe production promotion are verified. No Vercel deployment URL, project creation, backend mutation or production promotion is claimed. Authorized credentials/network access remain necessary; see launch-status.md for the smallest outside action.

### Final Milestone 4 local verification

Clean npm ci and production-mode npm ci --include=dev passed. ESLint, TypeScript and production build passed. Final suites: **22/22 security**, **11/11 operations**, **27/27 browser fixture tests**. One operations-test fixture initially lacked newly required trusted platform metadata; corrected the fixture and reran the affected checks. No current local failures remain. Live Appwrite, actual Vercel Firewall, remote deployment and two-user acceptance remain blocked/unrun, not passed.

No actual Vercel project/deployment was created; correct owner/team and any existing project cannot be discovered while logged out and network-blocked. The smallest remaining outside action is secure Vercel/Appwrite authorization plus application of outbound permissions; routine engineering resumes afterward from docs/launch-runbook.md. GitHub commit/push and PR outcome are reported in the task response; no default-branch changes or force pushes.

### Confirmed source publication

Code commit `c8fa71855f521b1ba6385015d5b70f2f1981fdba` successfully pushed to feat/milestone-4-launch; native remote verification matched it. REST PR creation was attempted as the supported alternative to the previously blocked GraphQL route and returned Forbidden. No PR or production deployment was created. This documentation-only follow-up records those confirmed results; its SHA is reported in the task response. CI workflow source is pushed, but a successful remote CI run is not claimed.

### Milestone 4 — exact existing-project deployment continuation

Started from 6187d8bd043197fee3baa67c90cc73e9973e9e4f on feat/milestone-4-launch. Target is the founder-supplied existing Vercel project your-city / prj_I9ANo3tGUECTuC53MeDAmURntFIh. Added an official-SDK metadata audit and guarded Preview command; they never create projects or promote production, inspect only environment names/scopes, verify GitHub linkage and pushed source, and validate deployment readback. Already configured remote Appwrite secrets need not be copied locally. The optional direct backend audit is now appwrite:preflight.

Fresh deployment safety tests: 5/5; lint, typecheck and production build passed. Application fixture suites remain the previous verified 22/11/27 results; not rerun for tooling-only changes. Vercel CLI remains Logged out, VERCEL_TOKEN unset, no relevant connector exposed; exact-project API probe is refused at cloud proxy CONNECT 403. launch:preview exits 2 before network/deployment creation. Secure project-scoped Vercel authorization and applied api.vercel.com permission are the minimum outside actions. Remote env scopes, live Appwrite, actual Firewall rules, Preview and production remain unverified. No main/default/other branch changes. Commit/push result is reported with the final SHA in the task response.

### Visible MVP — public product experience

Implemented on dedicated branch feat/visible-mvp, based on the existing launch candidate 6b4830714d08a53a2a941dc174c7183cb319db24. The public root now opens a complete, explicitly labeled city demo rather than an account/signup landing screen. Reused CityApp and preserved all authenticated Appwrite routes and server authorization.

- Added a warm green visual system, original city/book illustrations, a locally shipped illustrative photograph, desktop sidebar/right rail, mobile bottom navigation including bookmarks, reduced-motion-aware transitions, persisted light/dark themes and Russian/Kazakh parity.
- Eight bilingual fictional Shymkent stories and seven communities use the existing backend community IDs. Feed search, category filters, popular/new sorting, joined-community mode and helpful recovery states are interactive.
- Open community/post pages, local join/leave, post creation with gallery covers, comments with deletion, like/save/share controls, bookmarks and profile name/bio/avatar editing work without login or backend credentials. Own posts appear in the demo profile. All mutations remain local and clearly labeled; sample counts/comments are fictional.
- Versioned localStorage state survives navigation/reload and synchronizes tabs; blocked storage uses session memory with an honest localized warning. A browser test exposed a stale-language warning during locale switching; corrected it and reran the affected scenarios. User text renders as text, not HTML. Missing locally created post links recover to the feed.
- Final complete browser run: **39/39 passed** across desktop/tablet/mobile, covering both the public demo and existing Appwrite fixture flows. After the final compact-mobile hero and bookmarks-navigation adjustment, the **12/12 affected frontend cases** were rerun. Lint, TypeScript and production build passed; security **22/22**, operations **11/11** passed. Screenshots were inspected; 320px layouts and storage-denied behavior were exercised. Authenticated tests use the isolated local fixture, not the hosted Appwrite backend.
- A separate local production-server browser smoke, without Appwrite credentials or fixture, returned HTTP 200 for the root and six demo routes, no horizontal overflow and no page errors. The public MVP requires no external images or infrastructure configuration. Hosted Appwrite behavior is not newly claimed verified.

No new Appwrite/Vercel resources, secret changes, backend migrations, force pushes or unrelated branch modifications. Vercel authorization remains unavailable in this session, so no Preview deployment URL is claimed; frontend completion is independent of deployment. GitHub commit/push verification and final SHA are reported in the task response.

### Your City 2.0 — social MVP upgrade (2026-11-14)

Dedicated branch feat/social-mvp-2 starts at d61a73ea0ed5d48afdad5878a6e8364575008bb6. The existing design, public demo and authenticated Appwrite functionality are preserved. Implemented all six requested phases within the independent frontend/demo scope:

1. Three feeds (For You, City, Communities), transparent local relevance ordering, chronological city content, five content-type filters, district filtering, author usernames/dates/tags and expandable cards. Removed seed popularity and community-size metrics; displayed likes/follow connections come only from local actions.
2. Nested reply-to-user conversations, own-comment edit/delete with parent tombstones, quote-post creation, share links and clear action feedback. Reply indentation is capped for small phones; local post links honestly require the originating browser's data.
3. Bilingual city catalog with optional broad Shymkent administrative districts (Abay, Al-Farabi, Enbekshi, Karatau, Turan), shared by profile/post forms and feed filters. No exact addresses or GPS permissions. The authority reference is recorded in architecture.md; a fresh authority-site request was denied 403, so a live source-page verification is not claimed.
4. Linked author profiles, cover/avatar/name/username/bio/city/district, real local follow/unfollow counts starting at zero, Posts/Replies/Media/Likes tabs and a native modal editor with keyboard/focus behavior.
5. Notification center for locally performed reply/like/follow/community actions, read/unread filtering and persistence. Incoming-style examples require an explicit sample-events action and remain labeled. No real users receive events.
6. Local post/comment reports, reversible mute/block, hidden-author filtering (including quotes), localized loading/error/empty/success states, storage-denial fallback/feedback, keyboard controls, dark/light parity and 320px layouts. No server authorization protections were changed.

Additive storage migration preserves the previous demo's profile/posts/comments/bookmarks/memberships. Extracted social components reuse the shell and scoped theme. No new packages, backend resources, migrations, infrastructure projects or credentials were required.

Verification: lint and TypeScript passed; production build passed. Complete browser suite **57/57 passed** across desktop/tablet/mobile (27 existing Auth/CRUD fixture cases, 12 public MVP cases, 18 new social cases). Social domain/migration tests **5/5**, authorization **22/22**, operations **11/11** passed. Subsequent UX refinements were checked with targeted browser reruns; one run interrupted by a source edit during HMR was repeated after the source stabilized, with **6/6** affected cases passing. Current checks have no unresolved failures. A Kazakh ICU date-format hydration mismatch found in the first implementation was fixed using deterministic city-local date formatting and covered by tests.

A separate local production-browser smoke (no fixture/hosted backend) verified root HTTP 200, follow persistence, nested reply persistence, two genuine local activity notifications, zero page errors and no horizontal overflow. Desktop/mobile/dark screenshots were inspected and kept outside Git. The local production server runs on port 3000 for review. These results do not claim hosted Appwrite authorization, real cross-user social delivery or a public deployment. No external service blocks the completed demo features. Git commit/push outcome and exact SHA are reported in the task response; existing branches/history remain preserved.
