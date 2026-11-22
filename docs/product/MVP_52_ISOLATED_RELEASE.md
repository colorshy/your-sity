# MVP 5.2 isolated Appwrite and protected Preview

## Current status

The separate project `your-city-mvp51-lab` is an **allowlisted target**, not a project created by this repository. Appwrite project environments are unavailable on the current plan (observed `403 billing_plan_not_allowed`); do not retry that feature or upgrade the subscription as part of this runbook. No real rows, identities or keys from `your-city` are copied. The original Frankfurt project retains its one user, profile and post. Its data must remain untouched.

## Isolated bootstrap

Create a separate Appwrite Cloud project with exact ID `your-city-mvp51-lab`, or a loopback self-hosted project with the same ID. Keep the database initially empty. Supply `APPWRITE_MIGRATION_PROJECT_ID=your-city-mvp51-lab`, `APPWRITE_MIGRATION_DATABASE_ID=your_city_db` and a server-side `APPWRITE_MIGRATION_API_KEY` in a private environment. The CLI defaults to the pinned Frankfurt endpoint; for a local instance set `APPWRITE_MIGRATION_ENDPOINT=http://127.0.0.1:<port>/v1` and pass `--self-hosted`. No other project IDs or endpoints are accepted for apply.

Run `npm run mvp5:bootstrap` to inspect and print an additive plan. Run `npm run mvp5:bootstrap -- --apply --isolated` only after reviewing that plan; add `--self-hosted` for loopback. Repeat the dry run until `operations: []`. A partial provider failure leaves existing resources in place; rerun after inspecting the error and Appwrite's asynchronous column/index status. Existing drift in permissions, columns, indexes or seed values fails closed. The script does not repair or remove it. It creates the database, the eleven base tables, two MVP 5.1 tables, the private media bucket, Shymkent and seven community rows. All seeds are static, synthetic names and IDs.

The migration key needs database/table creation and read, row creation/read, and bucket creation/read scopes. The runtime key needs `sessions.write`, `tables.read`, `rows.read`, `rows.write`, `buckets.read`, `files.read`, `files.write`. Never pass a migration key to Vercel runtime. Confirm Cloud Storage plan permits the bucket's 5 MiB limit, antivirus and metadata stripping before applying. The script rejects unsupported settings instead of weakening them.

## Preview binding

Set the existing Vercel project `your-city` Preview variables **restricted to `feat/mvp-5-social-feed`**: `APPWRITE_API_KEY` (isolated runtime key), `APPWRITE_TARGET=isolated`, `APPWRITE_PROJECT_ID=your-city-mvp51-lab`, `APPWRITE_DATABASE_ID=your_city_db`, `APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1`, `APPWRITE_MODERATOR_IDS` (only synthetic moderator account IDs), `VERCEL_AUTH_RATE_LIMIT_ID`, and `VERCEL_WRITE_RATE_LIMIT_ID`. Do not reuse the MVP 4 branch bindings. Do not place provider or deployment credentials in `NEXT_PUBLIC_*`. Keep SSO and Firewall rules enforced. Verify project/team/repository identity and branch-specific metadata with `npm run launch:preflight`. Before the deployment command, `npm run launch:preview` reads back the branch values through Vercel's authenticated API and requires the exact isolated identity; it does not print them. Then it deploys only a protected Preview using the exact committed SHA. The runtime also requires Vercel's Preview context and `VERCEL_GIT_COMMIT_REF=feat/mvp-5-social-feed` before it will accept the isolated key.

Do not deploy this revision against the shared `your-city` project until its separate backup/restore and additive migration gates are authorized and completed. No Production variables or deployment should change.

## Live acceptance gate

On the isolated Preview, verify `/api/ready` returns HTTP 200 and `{"status":"ready"}`. Then use only disposable accounts to check signup/login, Shymkent onboarding, community membership, text posts and 1–4 images (JPEG/PNG/WebP, each at most 5 MiB), private read denial, rejected unauthorized upload, deleted/hidden media denial, repost/undo and duplicate prevention, refreshed counts, legacy text posts and cleanup. Recheck the exact deployment URL and SSO protection before recording a pass. Local fixture results do not satisfy this gate.

For rollback, return Preview to the prior revision and stop new uploads. Keep private resources until a verified export and cleanup. `npm run mvp5:cleanup` is a dry-run; `--apply-isolated --isolated` deletes only isolated candidate files and association rows. It never operates on the shared project. Public invitations remain blocked pending live acceptance and the Kazakhstan personal-data review.
