# MVP 5.2 isolated Appwrite and protected Preview

## Current status

The connected Appwrite operator reports that the separate Frankfurt project `6ab4b121002386b3d769` is already provisioned with database `your_city_db`, all 13 tables and available columns/indexes, the private 5 MiB media bucket with JPG/PNG/WebP, antivirus and metadata stripping, Shymkent and seven synthetic communities. It reports zero users and zero personal posts. These provider observations are operator-reported, not a readback from this repository session. Appwrite project environments remain unavailable on the current plan (observed `403 billing_plan_not_allowed`); do not retry that feature or upgrade the subscription. The original `your-city` project and its real data must remain untouched.

## Isolated bootstrap

The lab already exists. **Do not recreate its project, database, tables, bucket or seed rows.** If read-only migration credentials become available, set `APPWRITE_MIGRATION_PROJECT_ID=6ab4b121002386b3d769`, `APPWRITE_MIGRATION_DATABASE_ID=your_city_db` and `APPWRITE_MIGRATION_API_KEY` privately, then run `npm run mvp5:bootstrap` without apply flags. Require `operations: []` and verify the provider metadata readback. The CLI defaults to the pinned Frankfurt endpoint. No other project IDs or endpoints are accepted for apply.

The bootstrap code remains available for a future empty isolated fixture. Its dry run plans missing resources; its explicit isolated apply creates the database, eleven base tables, two MVP 5.1 tables, private bucket and eight static synthetic catalog rows. Existing drift in permissions, columns, indexes or seed values fails closed. For the already-provisioned lab, an unexpected nonempty plan is a blocker for investigation, **not permission to apply it**.

Read-only metadata access is enough for the lab dry run. The future runtime key needs `sessions.write`, `tables.read`, `rows.read`, `rows.write`, `buckets.read`, `files.read`, `files.write`. Never pass a migration key to Vercel runtime. The reported bucket settings still need independent readback before live acceptance; do not weaken them.

## Preview binding

The operator reports that seven non-secret variables are already scoped to `feat/mvp-5-social-feed` on the existing Vercel project `your-city`: `APPWRITE_TARGET=isolated`, `APPWRITE_PROJECT_ID=6ab4b121002386b3d769`, `APPWRITE_DATABASE_ID=your_city_db`, `APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1`, `APPWRITE_MODERATOR_IDS`, `VERCEL_AUTH_RATE_LIMIT_ID`, and `VERCEL_WRITE_RATE_LIMIT_ID`. The isolated `APPWRITE_API_KEY` runtime credential is still pending. Do not reuse the MVP 4 branch binding, place provider or deployment credentials in `NEXT_PUBLIC_*`, or change Production. Keep SSO and Firewall rules enforced. Once the runtime key exists, verify project/team/repository identity and branch-specific metadata with `npm run launch:preflight`. Before deployment, `npm run launch:preview` reads back the branch values through Vercel's authenticated API and requires the exact isolated identity; it does not print them. Deploy only after readiness prerequisites can pass, then verify `/api/ready` on the protected Preview. The runtime requires Vercel's Preview context and `VERCEL_GIT_COMMIT_REF=feat/mvp-5-social-feed` before it will accept the isolated key.

Do not deploy this revision against the shared `your-city` project until its separate backup/restore and additive migration gates are authorized and completed. No Production variables or deployment should change.

## Live acceptance gate

On the isolated Preview, verify `/api/ready` returns HTTP 200 and `{"status":"ready"}`. Then use only disposable accounts to check signup/login, Shymkent onboarding, community membership, text posts and 1–4 images (JPEG/PNG/WebP, each at most 5 MiB), private read denial, rejected unauthorized upload, deleted/hidden media denial, repost/undo and duplicate prevention, refreshed counts, legacy text posts and cleanup. Recheck the exact deployment URL and SSO protection before recording a pass. Local fixture results do not satisfy this gate.

For rollback, return Preview to the prior revision and stop new uploads. Keep private resources until a verified export and cleanup. `npm run mvp5:cleanup` is a dry-run; `--apply-isolated --isolated` deletes only isolated candidate files and association rows. It never operates on the shared project. Public invitations remain blocked pending live acceptance and the Kazakhstan personal-data review.
