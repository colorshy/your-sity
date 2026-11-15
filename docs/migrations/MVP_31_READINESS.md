# MVP 3.1 migration readiness report — prepared, not cloud-applied

Target: Frankfurt `https://fra.cloud.appwrite.io/v1`, existing project `your-city`, existing database `your_city_db`. The founder reports seven existing tables, four missing social tables and three missing fields. This is supplied context, **not a live schema inspection** by this execution.

## Exact additive contract and offline planner

The canonical migration remains [MVP_3_APPWRITE.md](MVP_3_APPWRITE.md). Machine-readable definitions and a pure planner are in `src/lib/migrations/mvp3.ts`; there is no executor, SDK, credential handling, row access or network access in that module/CLI.

The connected operator exports complete metadata into a local JSON file with envelope:

```json
{
  "endpoint": "https://fra.cloud.appwrite.io/v1",
  "project": "your-city",
  "database": "your_city_db",
  "tables": []
}
```

Replace the empty array with all seven existing core `TableMetadata` objects and any already existing social tables. Each object contains `$id`, `enabled`, `rowSecurity`, `$permissions`, complete `columns` and complete `indexes`; preserve actual names/types/sizes/required/default/array/status and index columns/types/status. Omit a new table only after the operator confirmed it absent. Collect every metadata page; a partial export cannot certify compatibility. Exclude records, passwords, keys and session values. Core tables must never be omitted or recreated.

```sh
npm run migration:plan -- --snapshot /secure/path/operator-metadata.json
npm run test:migration
```

The planner outputs only create-table/create-column/create-index proposals. Missing snapshot or incompatible metadata exits 2 with `cloudExecuted=false`. No command applies the plan. The connected operator reviews it and performs approved operations separately, replanning after resources become available. An available equivalent index is reused even under another name; physical comment-field aliases are resolved. Processing/pending columns/indexes cause a wait/block rather than duplicate creation. Existing conflicting columns/index names/permissions cause a block, never an automatic alteration. Completed compatible metadata produces zero operations. Local tests simulate additive application, partial completion and a second empty plan without changing the input snapshot.

Expected table additions: `post_likes`, `bookmarks`, `connections`, `notifications`, enabled=true, rowSecurity=false, table permissions=[] and all created row permissions=[]. Their 13 columns are defined exactly by the canonical migration (required scalar IDs/kinds, nullable notification target IDs, required boolean is_read without schema default). Existing nullable additions: profiles.social_version, comments.parent_id, reports.comment_id — scalar string capacity >=36, required=false, default null/unset. Total missing columns for the supplied baseline: **16**. All 11 runtime tables retain existing core policy/unique-index requirements.

Index proposals include unique likes(user_id,post_id), bookmarks(user_id,post_id), connections(user_id,target_id,kind), plus post likes, bookmark user, connection user/inbound block, recipient notification and comment author/post query indexes. Equivalent existing key/unique prefixes can be reused; confirm actual provider query plans. System timestamp/ID index support is not guessed or mutated by the planner: the operator must verify `$createdAt DESC, $id DESC` via appwrite:preflight. Unique-index creation must stop on existing duplicate records; do not delete or reassign records to make it pass.

## Audit discrepancies corrected

- The old handoff was prose-only; there was no verifiable idempotent plan. Added the offline planner and convergence/conflict tests.
- Runtime accepted non-null defaults for nullable parents/report targets/version fields and optional required social fields. It now rejects those mismatches; it does not invent parent IDs or defaults.
- Runtime configuration allowed another HTTPS Appwrite project/endpoint. It now pins the existing Frankfurt project/database; only non-production loopback fixtures are exempt.
- Protected resident routes checked onboarding but not the city at that boundary. They now also validate the server-owned Shymkent resident profile.
- Deployment tooling still targeted feat/milestone-4-launch. Current audits/Preview source checks now target feat/mvp-3-multiuser on the same Vercel project. Preview bindings must include trusted moderator IDs as well as server Auth/schema and Firewall configuration.
- Live runner previously accepted any HTTPS URL and tested only already onboarded accounts. It now verifies Vercel API readback, exact immutable Preview URL/project/branch/SHA, non-production target and backend readiness before credentials/writes. Browser requests cannot redirect to another origin. Explicit registration mode covers new supplied accounts; a separately provisioned moderator covers moderation and direct private-table/ownership denial. Reports/traces/videos/screenshots remain disabled, and captured test output redacts supplied credentials.

## Connected Appwrite operator tasks — no admin credentials requested

1. Inspect/export the exact existing tables, permissions, all column/index metadata pages and current transaction support. Preserve the seven core tables and all existing rows/IDs/grants. Confirm shymkent and drivers/discounts/city-news/students/neighborhoods/events/marketplace IDs. Do not recreate resources.
2. Review the offline plan; create only missing social tables with private grants, then missing columns, wait available, then missing indexes and wait available. Do not backfill parent IDs, social versions, authors or moderation statuses. If existing policies or data conflict, report the discrepancy for separate resolution; this additive migration never silently changes existing grants or records.
3. Re-export/replan: operations must be empty and inspectSchema must accept all 11 tables. Run read-only query preflight and the separately authorized transaction create/rollback probe. Record actual outcomes; metadata tests do not prove row permission enforcement or concurrency.
4. Register only the authorized immutable HTTPS Preview hostname/callback. Provision server-only application configuration through secure existing-project environment management; do not send administrator keys to Codex/chat or add DDL scopes to the application key. Provision the moderator Account ID through APPWRITE_MODERATOR_IDS, never through editable profile data.
5. Supply consenting disposable A/B accounts (or new email/password pairs for explicit registration mode), a separate prepared moderator, and inspect resulting test content/session cleanup. The application runner uses account passwords, not an administrator Appwrite key. Confirm private table reads/writes are denied to anonymous and authenticated direct clients and verify simultaneous block/interaction transaction conflicts on real Appwrite.

## Preview and live acceptance gates

Use only the existing Vercel project `prj_I9ANo3tGUECTuC53MeDAmURntFIh`, repository colorshy/your-sity and current branch. No deployment is performed by this task. Missing key/bindings/rules, wrong runtime identity and incompatible schema fail closed. Actual Firewall allowed/limited/provider-error behavior still requires live acceptance.

See [MULTIUSER_BETA.md](../product/MULTIUSER_BETA.md) for secure runner variables and phases. `npm run test:live` requires a read-authorized VERCEL_TOKEN, BETA_BASE_URL (immutable deployment origin), BETA_COMMIT, supplied A/B credentials, supplied moderator credentials and BETA_ALLOW_WRITES=1. Set BETA_REGISTER_ACCOUNTS=1 only for new supplied email pairs whose registration has been authorized; otherwise use prepared onboarded accounts. No credentials are generated for live tests. The permissions phase depends on successful account/social tests. A failed write-denial assertion is a security failure, not a passing mock result. Direct Appwrite session-cookie support, email signup policy, actual moderation and transaction semantics must be observed on the hosted service.

Current status: offline migration preparation/tests are independently verifiable. Cloud application, real query plans, Preview deployment identity/Firewall and two-account acceptance remain unverified until the connected operators perform their authorized steps. No schema mutation, backend replacement, production deployment or production merge is part of this execution.
