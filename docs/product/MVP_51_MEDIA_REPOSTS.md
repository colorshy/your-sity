# MVP 5.1 migration and recovery

For the separate full-project bootstrap and branch-specific Preview procedure, see [MVP_52_ISOLATED_RELEASE.md](MVP_52_ISOLATED_RELEASE.md).

The source implements repost rows, private post media and authenticated read/upload routes. Legacy text-only posts have no `post_media` rows and continue rendering. These resources **have not been created in the shared Appwrite project**. The strict runtime schema gate will reject a deployment until the two new tables and bucket are verified in the target project.

## Resource contract

`post_reposts`: `user_id` and `post_id` required 36-character strings; unique `(user_id, post_id)` and key indexes on both individual columns. `post_media`: required `post_id`, `file_id`, `owner_id` strings; required integer `position`, `bytes`; required `mime` string and `ready` boolean. Unique `file_id`, unique `(post_id, position)` and key `post_id` indexes. Both tables are enabled, with no client permissions and `rowSecurity=false`; only the trusted server key accesses them, and `CityService` checks users, membership, post status and ownership. The `your-city-post-media` bucket is enabled, private, fileSecurity enabled, no bucket permissions, 5 MiB maximum, JPG/PNG/WebP extensions, antivirus and metadata stripping. `verifyMvp5Table` and `verifyMvp5Bucket` reject policy or index drift.

Runtime key scopes need `tables.read`, `rows.read`, `rows.write`, `buckets.read`, `files.read`, `files.write`, and the existing `sessions.write`. Migration credentials for an isolated project additionally need table and bucket creation scopes. The migration CLI refuses `--apply` against project `your-city`; the shared project needs a separate authorized change procedure. Do not put keys in source or shell history.

## Safe sequence

1. Export existing schema metadata and all affected row IDs/content; secure an Appwrite database and Storage backup and verify restore in a separate project. Record counts of the existing user, profiles, communities and published posts. Keep the prior source revision available for rollback.
2. Set `APPWRITE_MIGRATION_PROJECT_ID`, `APPWRITE_MIGRATION_API_KEY` and optional endpoint/database variables for an **isolated** project. Run `npm run mvp5:migrate` for a read-only plan, then `npm run mvp5:migrate -- --apply --isolated`. Re-run dry-run; it must report no operations. Run isolated signup, upload, access-denial, repost, deletion and cleanup checks.
3. For the shared project, get explicit authorization after the verified backup/restore. Audit actual scopes and Preview branch bindings, add only the missing resources, verify metadata, then deploy an exact committed source revision to a protected Preview. Do not touch Production. Check `/api/ready` before browser acceptance. The MVP 5 branch does not inherit MVP 4 branch-specific secrets automatically.
4. Rollback: stop uploading and return Preview traffic to the prior revision. Existing core tables are untouched. Retain new private tables and bucket for forensic/retry work until export and cleanup are verified. Do not drop them as an automatic rollback. Run `npm run mvp5:cleanup` in dry-run mode to find stale orphan files and hidden/deleted post media; `--apply-isolated --isolated` acts only on an isolated project. Deletion is retryable because it deletes Storage first, then the association row.

## Upload path and limits

Next Server Actions default to a 1 MiB request body; Vercel Functions have a 4.5 MiB payload limit. The composer sends raw chunks of at most 4 MiB to `/api/media/upload`; only small text and draft ID go through `savePost`. The route enforces same-origin requests, Vercel write Firewall, session/resident checks, four positions, 5 MiB total and ownership. It stores a private pending association, sends each chunk to Appwrite Storage with Content-Range, re-reads the completed file, checks signature and MIME, and decodes with Sharp. The file becomes usable only after `ready=true`. Reader requests go through `/api/media/[id]`, which checks the current post visibility each time and sends `private, no-store`; no permanent public file URL is issued. Pending uploads older than 24 hours are cleanup candidates. Operators must schedule cleanup at an appropriate interval after isolated testing.

The Frankfurt hosting and Kazakhstan personal-data review remain launch blockers. No public invitations are authorized by this code delivery.
