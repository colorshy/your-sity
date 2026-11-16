# MVP 3.5 — Live Preview and closed-beta acceptance

Date: 2026-11-16. Verdict: **NOT BETA READY**.

## Source and authority

- Repository: `colorshy/your-sity`.
- Starting source: `feat/mvp-34-product-experience`, `9b7ced78e20e877c6e336561a2482b01bf569453`; local HEAD and independent remote branch readback matched before changes. PR #5 and parent PR #4 are supplied by the operator; their hosted state/checks could not be read through the GitHub API.
- Existing authorized Vercel target: `your-city`, project `prj_I9ANo3tGUECTuC53MeDAmURntFIh`, team `team_jmYWtlOQ0orAIYZeWc3LUOrR`.
- Existing Appwrite target: `https://fra.cloud.appwrite.io/v1`, project `your-city`, database `your_city_db`.
- The operator reports the additive migration applied and eleven tables present. This is recorded as operator-supplied information, **not** an independently executed hosted preflight. No migration was reapplied.
- The release-safety changes below create a new source revision. Future deployment must use the exact clean, pushed branch tip and record its SHA; do not label an older deployment as this release. No Preview of either the starting SHA or the revised source was created or verified during this execution.

## Observed live results

| Gate                                                                            | Result       | Evidence                                                                                                                            |
| ------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Hosted Appwrite schema, eleven tables, indexes, nullable fields and permissions | BLOCKED      | `npm run appwrite:preflight` exits 2: missing `APPWRITE_API_KEY`, zero network requests.                                            |
| Hosted Shymkent rows and query/index behavior                                   | BLOCKED      | The same missing credential prevents the read-only backend verifier.                                                                |
| Hosted transactions and conflict behavior                                       | NOT EXECUTED | No authorized test credential/environment. No transaction create/rollback or content writes attempted.                              |
| Vercel project, Preview environment and SSO metadata                            | BLOCKED      | `npm run launch:preflight` exits 2: missing `VERCEL_TOKEN` or authenticated integration, zero network requests.                     |
| New immutable Preview, HTTPS and source SHA readback                            | NOT EXECUTED | No deployment authorization/network path or runtime configuration audit. No URL is available.                                       |
| Real two-account acceptance and moderator permissions                           | BLOCKED      | `npm run test:live` exits 2 before network; missing verified Preview, supplied disposable accounts and authorization.               |
| Actual Firewall allow/limit/missing-rule/provider-error behavior                | NOT EXECUTED | Requires the authorized Preview and existing project rules. Local policy tests are not hosted Firewall evidence.                    |
| Hosted CI/check status                                                          | UNVERIFIED   | `gh pr view 5 ... --json ...statusCheckRollup` returned GitHub GraphQL `Forbidden`. Local commands below are not hosted CI results. |

The selected runtime reports an enforced restricted network policy, no configured runtime variables/secrets/outbound identities, and no Appwrite/Vercel connector. The process has no Appwrite key, Vercel token or beta credentials; `.env.local` and `.vercel/project.json` are absent. One credential-free read-only connection check to each actual service failed with curl exit 56 / `CONNECT tunnel failed, response 403`, HTTP 000, before remote authorization. This proves an environment egress denial, not invalid service permissions or an SSO failure. No retry loop, proxy bypass, credentials in logs or disabled TLS checks.

The live runner reports these missing names, without values: `BETA_BASE_URL`, `BETA_COMMIT`, `VERCEL_TOKEN`, `BETA_EMAIL_A`, `BETA_EMAIL_B`, `BETA_PASSWORD_A`, `BETA_PASSWORD_B`, `BETA_EMAIL_MODERATOR`, `BETA_PASSWORD_MODERATOR`; explicit `BETA_ALLOW_WRITES=1` is also absent. Neither real residents nor invented live accounts were used.

## Audit findings and necessary changes

1. **Stale source target corrected.** The Preview launcher and live-test verifier previously pinned `feat/mvp-3-multiuser`. They now pin `feat/mvp-34-product-experience`, reuse the exact existing project/team and refuse another team scope. No automatic team enumeration or project creation.
2. **Protection verified before credentials/writes.** Project metadata must confirm an SSO mode covering Preview URLs. Deployment audit refuses missing/unknown protection; the launcher rechecks project protection after deployment. The live runner verifies it before readiness or account credentials. No protection settings are written. Project SSO metadata is not proof of per-deployment effective protection or authorized automation access; verify those live too.
3. **Conflicting source metadata denied.** Deployment readback rejects GitHub SHA/ref fields that disagree with the exact verified local source and release metadata. Clean local/remote SHA verification, READY state, correct project and non-production target remain required. CLI source uploads use the clean source plus release metadata; GitHub metadata, when supplied, must agree.
4. **Preview secret boundary checked.** The environment metadata audit rejects `NEXT_PUBLIC_APPWRITE_API_KEY`, `NEXT_PUBLIC_VERCEL_TOKEN` and `VERCEL_TOKEN` in Preview runtime. It records whether canonical origin comes from trusted Vercel metadata or an explicit value that still needs independent validation. No remote values are decrypted or logged.
5. **CI branch coverage corrected.** The existing read-only, non-deploying GitHub Actions workflow now also runs on pushes to the current feature branch. Its previous pull-request trigger and historical branch are retained. This does not prove a hosted run completed.

Existing runtime behavior was inspected and retained: server-only Appwrite SDK clients, `Account.get` validation, Shymkent/onboarding guards, account-derived identities, ownership/member checks, private author projections and transactional writes. Production-built Preview uses `__Host-your-city-session`, Secure/HttpOnly/SameSite=Lax, Path=/ and no Domain. Logout revokes the session before clearing the cookie and remains outside the rate limiter. Redirects use local paths or trusted configured/platform origins. A wrong explicit `NEXT_PUBLIC_SITE_URL` can still misdirect verification callbacks; Preview must omit it to use trusted `VERCEL_URL` or supply the exact immutable HTTPS origin. The localhost example must not be copied into Preview scope.

Firewall checks enforce both auth/write rules for production-built Preview as well as Production. They use trusted platform metadata, fail closed on missing rules/provider errors, and do not fall back to an in-memory limiter. Changing language is also a guarded write. Missing live rules can therefore prevent login/setup; fix rule configuration, never weaken the guard. `/api/ready` proves configuration/schema/query readiness only, not sessions, transactions, mail, SSO or actual rate enforcement.

Pending UI disables duplicate clicks; it does not guarantee server-wide idempotency across independent post submissions. Hosted duplicate/concurrency tests remain required. Local memory/SDK transaction models cannot certify Appwrite's actual conflict semantics. Catalog discovery retains the documented 100-row bound, and photo attachments remain unavailable.

## Operator actions to unblock hosted acceptance

1. In the selected environment settings, permit `fra.cloud.appwrite.io` and `api.vercel.com`; permit `api.github.com` for hosted CI/PR evidence. After a Preview exists, permit its exact immutable hostname and any provider-required upload host identified by authorized tooling. Keep inherited proxy/TLS controls. No running-environment change tool is exposed here; saving a future environment draft would not fix this running session.
2. Bind read-authorized Appwrite credentials and authorized Vercel project/team access through secure environment settings or an authenticated integration. Never paste values into chat. Direct read-only Appwrite audit needs table metadata and row-read scopes. Transaction testing additionally needs separately authorized transaction access in the designated test environment. Vercel deployment requires existing-project deploy authority plus project/environment/deployment metadata read access.
3. Run `npm run appwrite:preflight`; require all eleven schemas, grants, indexes, nullable fields, Shymkent/catalog rows and representative indexed reads to pass. Resolve actual failures through the connected operator; do not reapply the migration or recreate resources. Only with explicit test/write authority run `npm run appwrite:preflight -- --verify-transactions`; empty create/rollback is not concurrency acceptance.
4. Run `npm run launch:preflight` against the fixed project/team and **current branch**. Confirm all required Appwrite/moderator/Firewall variables apply to Preview or this branch, not only Production or the older branch. Review actual binding values through authorized settings without printing them. Preserve Production scopes/settings, SSO and Git auto-deployment settings. Deploy credentials must not become application variables; proxy placeholders must not be copied as runtime secrets.
5. On the exact clean, pushed revision, run `npm run launch:preview` only after the audit passes. It creates Preview only and verifies READY/project/branch/SHA. Independently record the immutable HTTPS URL, deployment ID, metadata SHA/ref and effective protection. Do not use an alias or an older Preview. Register only the resulting callback origin through the authorized Appwrite integration if required.
6. For SSO automation, use Vercel's supported Protection Bypass for Automation secret in secure `BETA_PREVIEW_BYPASS`. The live runner sends `x-vercel-protection-bypass` only to the verified Preview origin; Appwrite receives no bypass secret. Keep SSO enabled. Human SSO access alone does not authorize the headless runner. An absent/invalid bypass or insufficient metadata access must block testing.
7. Supply disposable A/B accounts and a distinct server-provisioned moderator, exact `BETA_BASE_URL`/`BETA_COMMIT`, and explicit `BETA_ALLOW_WRITES=1`. For authorized fresh supplied email pairs, set `BETA_REGISTER_ACCOUNTS=1`; otherwise use prepared accounts. Supply actual test credentials securely. Run `npm run test:live`. Complete actual registration/mail verification, sessions, RU/KK, onboarding/profile, discovery/joining, A→B posts/comments/likes/notifications, bookmark privacy, follow/mute/block/unblock, logout, forged ownership/direct private-table denial and moderator actions. Inspect cleanup and revoke residual sessions.
8. Separately exercise hosted concurrent writes/duplicate retries, block-versus-interaction conflicts, rollback, post/comment moderation, email delivery, actual Firewall refusal modes and small-device acceptance. Record each executed result; do not imply the scripted social journey proves all gates. Invite a closed cohort only after successful hosted security acceptance is recorded. Never merge/promote/deploy to Production as part of this task.

## Local verification

Results from the fresh MVP 3.5 execution are recorded below after completion. They validate source and local fixtures only; hosted gates above remain blocked.

The existing unauthenticated `npm run launch:smoke` was also executed and exited 2 because `LIVE_BASE_URL` is missing. It is not a protection-bypass tool; on a protected Preview use the source-verified live runner with authorized automation access for readiness/account checks. An SSO redirect is not a backend readiness failure and must not be resolved by disabling protection.

| Command                   | Executed local result                                    |
| ------------------------- | -------------------------------------------------------- |
| `npm run lint`            | PASS, zero warnings/errors                               |
| `npm run typecheck`       | PASS                                                     |
| `npm run build`           | PASS, including a final build after release-tool changes |
| `npm run test:security`   | 32 passed, 0 failed                                      |
| `npm run test:social`     | 28 passed, 0 failed                                      |
| `npm run test:migration`  | 9 passed, 0 failed (also covered by security)            |
| `npm run test:operations` | 12 passed, 0 failed                                      |
| `npm run test:deployment` | 8 passed, 0 failed                                       |

The first fresh full browser run returned **62 passed, 1 failed** (4.8 minutes). The mobile two-account test navigated to `/notifications` immediately after clicking logout without waiting for the server action's redirect. The test now requires `/sign-in` after logout before attempting the protected route, then still requires access denial and independence of A's session. No authentication code or guard was loosened. A complete browser rerun was started after this correction; its final result is recorded below, not combined with historical partial runs.

Production client JavaScript was scanned for `APPWRITE_API_KEY`, `VERCEL_TOKEN` and the local fixture key marker: zero files contained these markers. The changed-file private-key/GitHub-token pattern scan found zero matches. This is a static/local check with no live secrets available, not certification of remote bindings. Environment files, `.vercel` state, screenshots, reports and build outputs remain outside Git.

**Final full browser rerun after correction:** `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test` — **63 passed, 0 failed** in **4.7 minutes**, tablet/desktop/mobile. This is one complete final run, not a combination of earlier results. The corrected logout sequence passed on all three device profiles.

Final environment readback still shows current observations, enforced egress excluding both service APIs, and zero configured secrets/runtime variables. Hosted statuses therefore remain unchanged. **Final verdict: NOT BETA READY.** No production deployment or PR merge.
