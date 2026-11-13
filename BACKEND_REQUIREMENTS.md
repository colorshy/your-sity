# Appwrite handoff for the connected ChatGPT backend operator

This document specifies the application's exact contract. Codex has not inspected or modified the live schema. The founder confirms the resources exist. Reuse them; do not recreate the project/database/tables, generate alternate IDs, replace existing rows, or delete data to satisfy this contract. Do not ask the founder to perform routine backend administration.

## Fixed resources

Endpoint `https://fra.cloud.appwrite.io/v1`, project `your-city`, database `your_city_db`.
Tables: cities, profiles, communities, community_memberships, posts, comments, reports.
Preserve city row `$id=shymkent` and community rows `$id` in drivers, discounts, city-news, students, neighborhoods, events, marketplace. Their community city reference must resolve to shymkent.

## 1. Inspect before changing

Through the connected Appwrite tools read every table's enabled flag, rowSecurity, permissions, columns (including status, required/default/array/format/enum/size), indexes and existing records. Check existing profile ownership/membership duplicates and the current transaction API availability. Report actual mismatches to this file's contract. Do not print private profile contents, sessions or API keys in chat.

The application uses TablesDB from node-appwrite 31.2.0. `npm run appwrite:inspect` is an optional **read-only** SDK inspection helper for a machine with authorized access. It never creates or changes resources. All ordinary application data operations fail closed if metadata does not meet the schema/permission contract.

## 2. Exact permission operation and expected result

Use the existing `updateTable` operation for each existing table, preserving name/description/data:

| Existing table                                            | permissions                     | rowSecurity | enabled |
| --------------------------------------------------------- | ------------------------------- | ----------- | ------- |
| cities, communities                                       | `[Permission.read(Role.any())]` | false       | true    |
| profiles, community_memberships, posts, comments, reports | `[]`                            | false       | true    |

Read back the metadata and assert the values. This is an intentional **trusted-server-only** data model: no browser/session client can create/update/delete rows, and private data is not directly readable. With rowSecurity=false, old per-row grants cannot bypass these table restrictions; preserve existing rows/row grants unless separately audited. Public city/community reads remain available. This also prevents spoofing author/user IDs through a direct Appwrite database request.

Next.js validates the real session with Account.get; only then does its server-only API-key client access data. It projects author display names without exposing profiles' city/locale/account data. Do not grant Role.users() create or update permissions to make the UI work. Do not enable direct browser database writes.

## 3. Columns / mapping contract

All ID references below are **scalar strings**, not relationship objects/arrays, maximum supported Appwrite ID length 36. Fields are not duplicated when an accepted alias already exists. Adapter mapping is automatic from actual metadata; if several aliases exist, the first column returned by metadata that matches is selected, so reconcile ambiguous alias columns rather than keeping conflicting copies.

| Table                 | Canonical field                 | Accepted existing aliases           | Required type / accepted values                             |
| --------------------- | ------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| cities                | name_kk                         | nameKk, name_kz                     | scalar string                                               |
| cities                | name_ru                         | nameRu                              | scalar string                                               |
| communities           | city_id                         | cityId                              | string, existing city ID                                    |
| communities           | name_kk / name_ru               | same aliases as cities              | scalar string                                               |
| communities           | description_kk / description_ru | canonical keys only                 | optional scalar strings; UI allows absence                  |
| profiles              | user_id                         | userId                              | string, actual Account.$id; immutable via user actions      |
| profiles              | display_name                    | displayName, name                   | string size >=80; server bounds 2–80 trimmed characters     |
| profiles              | city_id                         | cityId                              | string, shymkent initially                                  |
| profiles              | locale                          | language                            | string: kk or ru                                            |
| profiles              | onboarded                       | onboarding_complete                 | boolean                                                     |
| community_memberships | user_id                         | userId                              | string                                                      |
| community_memberships | community_id                    | communityId                         | string                                                      |
| posts                 | author_id                       | authorId, user_id, userId           | string, server-derived Account.$id                          |
| posts                 | community_id                    | communityId                         | string                                                      |
| posts                 | body                            | content, text                       | string size >=5000; server bounds 1–5000 trimmed characters |
| posts                 | status                          | moderation_status, moderationStatus | string/enum allowing published, hidden, deleted             |
| comments              | author_id                       | authorId, user_id, userId           | string, server-derived                                      |
| comments              | post_id                         | postId                              | string                                                      |
| comments              | body                            | content, text                       | string size >=2000; server bounds 1–2000                    |
| comments              | status                          | moderation_status, moderationStatus | string/enum allowing published, hidden, deleted             |
| reports               | reporter_id                     | reporterId, user_id, userId         | string, server-derived                                      |
| reports               | post_id                         | postId                              | string                                                      |
| reports               | reason                          | canonical only                      | string size >=1000; server bounds 5–1000                    |
| reports               | status                          | canonical only                      | string/enum allowing open, resolved, dismissed              |

All mapped columns must have status=available and array=false. SDK string/varchar/text/mediumtext/longtext scalar types are supported; enum is additionally supported for locale/status. Content capacity must meet the bounds above. Use Appwrite `$id`, `$createdAt`, `$updatedAt`; no duplicate id/timestamp columns are necessary. Extra unrecognized required columns without defaults cause readiness rejection because the app cannot safely invent their values. Supply their actual purpose/approved mapping to Codex or configure an appropriate optional/default state while preserving data. Do not loosen a meaningful existing constraint without reviewing it.

If a mapped column is missing, use the connected column-create operation on that existing table with the canonical name/type above. On populated tables add it safely as optional first, wait until available, then backfill only from verified corresponding existing data and finalize constraints/defaults. Never fabricate authors, user IDs or moderation history. In particular, do not turn previously hidden/flagged content into published content when backfilling status. If no trustworthy backfill exists, keep writes gated and report the incompatible records rather than assigning them to an arbitrary user.

New profiles use `$id=Account.$id`. Existing profiles with different row IDs are reused by their unique user_id. New memberships use the first 32 hex characters of SHA-256(JSON.stringify([userId,communityId])); existing memberships with different row IDs are reused. Do not rename or recreate existing rows.

## 4. Index operations

Inspect existing equivalent indexes first, using the mapped physical column names. Reuse them. Create missing indexes on the **existing** tables, using these stable suggested keys. Wait for status=available and verify the exact queries below. If duplicates prevent a unique index, report them without deleting records.

| Suggested key       | Table                 | Type   | Columns                                    |
| ------------------- | --------------------- | ------ | ------------------------------------------ |
| yc_profiles_user    | profiles              | unique | user_id                                    |
| yc_membership_pair  | community_memberships | unique | user_id, community_id                      |
| yc_communities_city | communities           | key    | city_id                                    |
| yc_memberships_user | community_memberships | key    | user_id (reuse unique prefix if supported) |
| yc_posts_city_feed  | posts                 | key    | community_id, status, $createdAt, $id      |
| yc_posts_author     | posts                 | key    | author_id, status, $createdAt, $id         |
| yc_comments_post    | comments              | key    | post_id, status, $createdAt, $id           |
| yc_reports_queue    | reports               | key    | status, $createdAt, $id                    |

The profile and membership unique indexes are mandatory readiness checks in the adapter. Index order for those unique constraints may differ. For built-in timestamp/id ordering, reuse Appwrite's system indexes when equivalent; if this deployment does not permit explicitly indexing a system column, choose the supported equivalent plan and verify the SDK query rather than changing data.

Queries to verify: profiles filtered by user_id; communities by city_id; memberships by user_id and user_id+community_id; posts by community_id IN city/joined IDs + status=published sorted $createdAt DESC/$id DESC; own posts by author_id+status with same order; comments by post_id+status; reports by status. Feed/comments use limit=21, offset=(page-1)*20.

## 5. Auth / server configuration

- Enable Appwrite email/password accounts and sessions. Configure the application's actual hostname as a Web platform/approved redirect hostname; local development canonical origin is NEXT_PUBLIC_SITE_URL.
- Provide server-only `APPWRITE_API_KEY` through deployment/cloud secret settings. It must authorize Account.createEmailPasswordSession (sessions.write) and the actual TablesDB table-metadata reads, row reads/writes and transaction create/commit/rollback operations. Determine the exact supported scope names from the connected project's scope list; do not give all scopes. The application does not create databases/tables/columns/indexes or manage users through the Users API.
- `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DATABASE_ID` use the fixed values above. No key is NEXT_PUBLIC. Next.js stores the returned session secret only in an HttpOnly, SameSite=Lax cookie; production uses Secure and __Host- prefix.
- Registration uses Account.create (anonymous account signup), then server session creation; new profile is identity-derived and idempotent. Onboarding uses an Appwrite transaction for profile/membership consistency. Publishing/editing/comment changes use transactions and server-side membership/ownership validation.
- Email verification is requested by an authenticated user from /profile; callback is NEXT_PUBLIC_SITE_URL/auth/confirm with Appwrite userId/secret. Verification tokens are not sessions and are not stored in application rows.
- Provision moderators only through trusted server configuration `APPWRITE_MODERATOR_IDS` (comma-separated Account IDs). User-editable preferences/roles/forms never grant moderator access. /moderation reads reports and can hide a reported post or dismiss the report transactionally.
- Configure deployment/edge abuse limits for Next.js auth actions and content writes. Do not assume API-key-backed Appwrite calls inherit anonymous endpoint rate limits; no distributed rate limiter is claimed by this milestone.

## 6. Acceptance checks using disposable authorized accounts

Verify actual SDK table metadata first, then signup/login/logout/reload, onboarding/name/language/city, search/join/leave/rejoin without duplicate memberships, city vs joined feed, post/comment create/edit/delete, and report/moderator decisions. Verify direct Appwrite unauthenticated AND session-authenticated row writes fail, private profiles/memberships/reports cannot be read directly, another user cannot edit/delete content via Next.js actions, forged author/role/user fields are ignored, moderated content cannot be restored by authors, and cross-city operations fail. Soft deletion redacts body to [deleted] and sets status=deleted; related records are preserved, not cascade-deleted.

No live acceptance result is claimed from local mocks. Codex will run the application's local checks and provide a commit; ChatGPT owns live Appwrite schema/permission administration and live acceptance in its separately connected integration.
