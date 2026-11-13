# Database — initial migration

`supabase/migrations/202611130001_foundation.sql` creates seven RLS-enabled public tables: cities, profiles, communities, community_memberships, posts, comments, reports. IDs use UUIDs, memberships use a composite key, reports enforce one report per user/post. Foreign keys, bounded nonempty names/text, status constraints, timestamps and query/foreign-key indexes are included.

The dedicated `your_city_private` schema contains trusted moderator IDs and helper functions. It is not a PostgREST exposed schema. Never grant app users access to moderator rows. Provision moderators through authorized administrative SQL only. The app uses only the publishable key and the user's session.

## Apply safely

Remote schema and migration history have not been inspected: the project API is blocked by the current cloud proxy, and no SQL credentials/management integration are available. Do not assume the project is empty.

Run the read-only `supabase/preflight.sql` through an authorized SQL Editor/connection. Inspect existing tables, RLS, functions, Auth triggers and migration history. If any proposed public table/function or your_city_private schema already exists, reconcile via a separate additive reviewed migration. This migration intentionally fails on conflicts; it does not DROP or replace existing data/objects. The entire migration is transactional. Existing Auth accounts receive new safe profiles; Auth records are untouched.

Apply once using Supabase migration tooling or SQL Editor with ownership privileges sufficient to create tables/functions and an auth.users trigger. Do not put database passwords or access tokens into Git. If applied through SQL Editor, record the corresponding migration version using your migration-management workflow before future db push operations; avoid reapplying it.

Seeds include Shymkent and seven community categories, with no fabricated posts, comments, reports or accounts. An Auth insert trigger creates a profile, validating the display-name length. `complete_onboarding` verifies identity, name, city and every community, locks the caller's profile and atomically saves choices. A selected city cannot be changed afterward through this MVP RPC.

## Authorization

| Data                 | Access                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| cities / communities | Public read; administrative writes only                                                                                                  |
| profiles             | Authenticated read of safe fields; owner updates display_name only                                                                       |
| memberships          | Owner read/delete; owner insert only in selected city                                                                                    |
| posts                | Authenticated visible-post read; joined same-city members insert under own identity; owner or moderator delete; no general update grants |
| comments             | Read only when parent post visible; members comment under own identity on nonhidden posts; owner/moderator delete                        |
| reports              | Reporter/moderator read; authenticated users report visible posts under own identity; no client status mutation                          |

Service/database-owner roles bypass RLS and must never be used to test normal users. Deleting an Auth account with authored content may be restricted by content foreign keys; account deletion/anonymization is a separate administrative workflow.

## Tests and limits

`npm run test:db` applies the actual migration inside PGlite (embedded PostgreSQL), supplies minimal auth.users/auth.uid and anon/authenticated roles, then SET ROLEs for each authorization case. It tests anonymous denial, own/cross-user profile writes, city/membership invariants, forged authors, nonmember publishing, hidden posts, comments, report privacy, trusted moderators, owner deletion, and safe migration collision rollback. This validates PostgreSQL policy behavior locally. It does not validate hosted Supabase grants/default privileges, JWT transport, email delivery or actual hosted migration state; rerun real-user checks against an authorized development project after configuration is applied.
