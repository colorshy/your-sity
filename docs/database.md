# Database plan (not applied)

Implement versioned migrations under supabase/migrations in milestone 3. No database provisioned or SQL executed in this phase.

| Table                 | Planned columns / rules                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| cities                | UUID PK, unique slug, localized name; seed Shymkent                                 |
| profiles              | auth.users UUID PK/FK, display_name, city_id FK, created_at; no public email        |
| communities           | UUID PK, city_id FK, unique(city_id, slug), localized name/description              |
| community_memberships | composite PK(user_id, community_id), created_at                                     |
| posts                 | UUID PK, community_id FK, author_id FK, bounded text, created_at, moderation status |
| comments              | UUID PK, post_id FK, author_id FK, bounded text, created_at                         |
| reports               | UUID PK, reporter_id FK, post_id FK, reason, status, reviewed_by, timestamps        |

Index posts(community_id, created_at DESC), comments(post_id, created_at), memberships(user_id), reports(status, created_at). Define deletion behavior deliberately and prevent profile removal from silently destroying moderation evidence.

Enable RLS on every table. Public reads only for public city/community metadata and visible posts; profiles expose only safe fields. Members may create posts in joined communities within their selected city. Owners may delete own posts. Comment creation requires authenticated membership. Membership inserts/deletes require auth.uid() = user_id. Users may submit reports but cannot read others’ reports or set resolution fields. City/community administration and report review require trusted moderator roles; users must never grant themselves roles. Use a private role table or server-managed claims; audit review actions. Avoid recursive membership policies.

Required integration tests: anonymous write denial; cross-user update/delete denial; nonmember post denial; cross-city post denial; hidden-post read denial; report privacy; moderator authorization; constraints and indexes. These checks are pending, not verified.
