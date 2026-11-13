# Existing Appwrite data contract

Backend: Frankfurt Appwrite Cloud, project your-city, database your_city_db. Existing tables/records are reused. This branch creates **no live resources**. ChatGPT's separately connected integration owns backend administration and actual acceptance; Codex supplies code and a precise [BACKEND_REQUIREMENTS.md](../BACKEND_REQUIREMENTS.md).

Seven tables: cities, profiles, communities, community_memberships, posts, comments, reports. The city row is shymkent; community IDs are drivers, discounts, city-news, students, neighborhoods, events, marketplace. Domain fields are defined in src/lib/appwrite/types.ts; schema.ts resolves accepted aliases from metadata and fails closed for unavailable/incompatible columns, unmapped required columns, unsafe table grants or missing unique indexes.

The authoritative field/enum/index/permission operations are in BACKEND_REQUIREMENTS.md. Public city/community metadata has read(any), rowSecurity=false. All other tables have permissions=[], rowSecurity=false. Browser/session database writes are denied; only authenticated Next.js server actions mediate them through a server key. Old row grants cannot bypass a table with row security disabled. This is deliberate server authorization, not SQL RLS or ownership inferred from an arbitrary row permission.

Profile user_id is unique; new row IDs equal Account IDs, while existing profile rows are reused by their user_id. A unique membership pair index plus deterministic new row IDs prevents duplicate joins. Existing differently keyed memberships are reused. New row permissions are empty; the server derives immutable identities. No account password/email/session secret is copied into tables.

Posts/comments use published/hidden/deleted status and Appwrite system timestamps. Deletion is a redacting soft delete. Reports use open/resolved/dismissed; the reporter identity is derived server-side and duplicates get a stable deterministic report ID. Moderators come only from trusted server APPWRITE_MODERATOR_IDS, not editable profile data. Moderator actions never give general users status update privileges.

Read queries use explicit city/member/user filters, 21-row lookahead for 20-item pages, and stable timestamp/ID ordering. Newest-first comment pagination and author projection are bounded. Transactions are required for onboarding/content/moderation changes; no unsafe nontransactional fallback is enabled.

Live tables/indexes/permissions have not been read by Codex because no MCP/key is available here. No live anonymous/session-negative test has passed in this session. The connected backend operator must inspect/reconcile schemas non-destructively, verify the exact SDK queries and direct-write denials, then perform two-user acceptance. Do not execute archived Supabase SQL against Appwrite or create replacement tables to hide a mismatch.
