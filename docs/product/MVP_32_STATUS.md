# MVP 3.2 — execution status and remaining live acceptance

Starting source: `feat/mvp-3-multiuser` at `5c755095867b119f69854739657b83165b4a1c5c`, matching native GitHub readback. Existing PR supplied by founder: https://github.com/colorshy/your-sity/pull/4. This report does **not** certify the product beta-ready.

## Observed status

| Area                                                                 | Status              | Evidence / dependency                                                                                                                              |
| -------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appwrite migration                                                   | BLOCKED             | No Appwrite tools, APPWRITE_API_KEY or explicit operator approval. No cloud schema operation attempted.                                            |
| Live schema/index/permission readback                                | BLOCKED             | No live metadata snapshot/read access. The supplied seven-table baseline is not a new readback.                                                    |
| Exact cloud migration plan                                           | BLOCKED             | Existing offline planner requires the operator's complete actual metadata. No snapshot was fabricated from fixtures.                               |
| Immutable Vercel Preview                                             | BLOCKED             | No Vercel tool/VERCEL_TOKEN, verified deployment URL or deployment SHA. No deployment or project change attempted.                                 |
| Real registration/login/onboarding/session/profile                   | BLOCKED             | No authorized Preview or supplied A/B credentials. Local Auth fixture results are separate.                                                        |
| Real shared social operations / feeds                                | BLOCKED             | Same Preview/schema/account dependencies; no backend fallback or localStorage substitute used.                                                     |
| Live moderator/private-row/ownership/concurrency/Firewall acceptance | BLOCKED             | No authorized moderator/Preview/backend. Local denial/conflict/limiter tests do not prove provider enforcement.                                    |
| Local automated verification                                         | PASSED (local only) | Lint/types/build; authorization 27/27, social 28/28, operations 12/12, deployment 6/6, migration 5/5, browser 60/60. Not hosted Appwrite evidence. |
| Production                                                           | NOT STARTED         | No deployment, promotion, merge, schema permission change or data mutation.                                                                        |

The environment check used presence flags only: APPWRITE_API_KEY, VERCEL_TOKEN, BETA_BASE_URL, BETA_COMMIT, supplied A/B/moderator emails/passwords and BETA_ALLOW_WRITES were absent. No secret values were printed or requested in chat. Appwrite preflight, snapshot planner, Vercel preflight and live runner all exited 2/BLOCKED before network requests. Saved configuration on some external Vercel account is not inferred absent; it simply cannot be inspected from this session.

## Independent work completed without rewriting MVP 3.1

Reused the implemented schema gates, idempotent planner, session/city/ownership validation, transactional social operations, private projections, recommendation engine and verified-Preview runner. No application redesign, new infrastructure/dependency, backend change or migration rerun.

Added a separate `live-tests/lifecycle.spec.ts` acceptance phase for profile editing/persistence, owned post editing/deletion, B reading edited content, For You/City/Communities visibility, City chronology, leave/rejoin changing Communities while retaining City access, and **A blocking B**, with server detail/feed denial and restoration after unblock. Test content is explicitly marked; owner cleanup attempts to redact the test post, restore A's display name and temporary connection/membership changes. These are prepared checks, not observed live successes. Failed cleanup must be inspected on the disposable accounts; test comments/notifications/tombstones can remain by design.

Fixed two test-harness defects identified from existing code: login restores the persisted profile locale (so selecting Russian only before login does not guarantee Russian selectors afterward), and a prepared nonmember must wait for confirmed server join state before navigating. Login helpers now normalize the test UI language after successful login; the shared setup waits for confirmed membership. No server authorization was weakened. Original public demo storage remains unchanged.

The live configuration now orders three independent phases: `accounts` → `lifecycle` → `permissions`. Registration mode still uses only explicitly supplied new email/password pairs; no live credentials are generated. Existing moderator tests replay A's owner form under B's identity and test anonymous/session private reads/writes plus real moderator hiding. Actual Appwrite query plans, conflicts, email verification and Firewall behavior remain live gates. Enumeration/typechecking of a live test is not a passed integration test.

## Exact operator handoff

1. **Connected Appwrite operator:** inspect all existing core tables and any social additions in Frankfurt project `your-city`, database `your_city_db`. Export complete metadata (all pages of columns/indexes) using the envelope in [MVP_31_READINESS.md](../migrations/MVP_31_READINESS.md). Preserve shymkent and drivers/discounts/city-news/students/neighborhoods/events/marketplace IDs, all auth identities, records and ownership fields.
2. Generate the actual plan using the existing command below. Review exact operations and obtain explicit operator approval **before** any schema mutation. If approved and authorized, apply only missing private post_likes/bookmarks/connections/notifications tables, nullable profiles.social_version/comments.parent_id/reports.comment_id, and required unique/query indexes. Existing incompatible metadata blocks the migration; never fix it by deleting data or weakening grants. Full field/default/type/grant/index contract: [MVP_3_APPWRITE.md](../migrations/MVP_3_APPWRITE.md).
3. Wait until each added column/index is available, export metadata again and require zero remaining operations. On authorized configuration, run query/schema preflight; run the optional transaction create/rollback probe only when separately authorized. Verify real anonymous AND session private-row denial and conflicting concurrent block/interaction transactions.
4. **Authorized Vercel operator/session:** inspect existing project your-city / prj_I9ANo3tGUECTuC53MeDAmURntFIh, repository linkage, current feature branch Preview bindings, server-only Appwrite configuration, trusted moderator ID and both Firewall rules. Use the existing guarded Preview command only after authorization/configuration/source verification. Register its exact immutable HTTPS hostname/callback in Appwrite; confirm the provider's READY state and exact source SHA. No Production target or project creation.
5. Supply consenting disposable A/B accounts plus a separately provisioned moderator through secure configuration. Set the exact BETA_BASE_URL/BETA_COMMIT and read-authorized Vercel access; opt into test writes. For new supplied email pairs, explicitly set BETA_REGISTER_ACCOUNTS=1; otherwise use prepared onboarded accounts. Supported Preview automation access is optional and never disables protection. Execute the three live phases only after provider/schema gates pass; record actual passed/failed/blocked outcomes, clean up disposable records and revoke residual sessions.

```sh
# Offline only; operator metadata, not fixtures:
npm run migration:plan -- --snapshot /secure/path/operator-metadata.json

# Authorized read/query verification (server key only through secure configuration):
npm run appwrite:preflight
# Optional transaction probe, only after separate operator approval:
npm run appwrite:preflight -- --verify-transactions

# Existing-project audit; no project/deployment created:
npm run launch:preflight
# Only after Vercel/source/configuration authorization:
npm run launch:preview

# Supplied accounts on a provider-verified immutable HTTPS Preview:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:live
```

Source/test preparation and local QA cannot satisfy these external dependencies. MVP 3.2 remains **BLOCKED for live beta acceptance**, until real Appwrite readback and authorized Preview/two-user/moderator evidence exist. Do not promote this report or a local fixture result to a live beta approval.
