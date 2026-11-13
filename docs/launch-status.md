# Milestone 4 status — 2026-11-13

**INCOMPLETE: no live Vercel URL has been created or verified.**

## Verified blockers

| Requirement                   | Evidence / status                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel identity/team/project  | No connector, token, cached auth or linked project. CLI 65.15.0 reports Logged out. Existing remote project existence/owner remains unknown, not assumed absent.        |
| Vercel API access             | HTTPS CONNECT refused by the cloud proxy (403) before Vercel auth. Team authorization/SSO/plan cannot be diagnosed from that response.                                  |
| Supported owner authorization | CLI login failed with fetch failed before yielding an approval URL. A diagnostic retry enabling inherited Node proxy use also failed.                                   |
| Anonymous dry inspection      | Both ordinary dry and temporary+dry are blocked by login_required; no deployment or source manifest was returned.                                                       |
| Real Appwrite access          | No server API key or connector exposed; official endpoint probe blocked at proxy CONNECT (403). No hosted schema/index/permission/Auth/transaction result was observed. |
| Secure runtime configuration  | Secret/domain requirements saved in the environment draft; runtime still exposes no bindings and no custom hosts. Saving is not application of those changes.           |
| Live acceptance               | Not run: no real backend access and no preview URL. No two real test accounts, posts, comments or reports were created here.                                            |
| Production promotion          | Not attempted; no failing/unverified preview was promoted.                                                                                                              |

## Candidate changes

- Added Next.js/Vercel Frankfurt configuration, Node 24 runtime pin, secure upload exclusions, and disabled automatic Git deployments pending live acceptance.
- Added official @vercel/firewall production auth/write guards. Missing/not-found rules, WAF blocks, provider failures/timeouts and invalid platform host metadata deny mutations. No process-memory production bypass exists; development fixture execution is explicitly distinguished.
- Fixed canonical origin validation: Production requires actual HTTPS origin, Preview can use trusted Vercel deployment metadata; incoming Host/Forwarded values never select a credential-forwarding destination.
- Added minimal liveness/readiness endpoints, security response headers, enumerated operational logging and sanitized SDK error boundaries to prevent raw provider payloads from reaching framework error logs.
- Added local preflight/read-only live smoke helpers, CI fixture checks, release runbook and backend handoff updates. No existing data or branch history was deleted/rewritten.

## Tests

Final command outcomes are appended below after completion. The previous 22 domain/security tests remain applicable; the browser suite now includes status-only health/readiness/header checks on the loopback fixture. Operational tests cover production missing/unavailable limiter behavior, trusted origins/hosts, error/log redaction and readiness prerequisites. These are not live Vercel Firewall or Appwrite permission tests.

Production-server local probe: /api/health=200/status ok; /api/ready=503/status not-ready with missing config. Both returned no-store, nosniff and DENY frame protection, without x-powered-by or private settings. This is a verified safe refusal, not a deployable site's readiness claim.

Preflight and live smoke returned exit 2 (blocked), not passed. Preflight performs no network requests while required credentials/rule IDs/origin are absent. No remote build logs or deployment ID exist to report.

## Smallest next action

An authorized account owner/integration must bind the Vercel credential to the correct team and securely provision Appwrite server access, and apply the saved outbound permissions. Do not paste secrets into chat or recreate backend tables. No routine code/ID/table setup is assigned to the founder. Once access is supplied, the agent can resume actual discovery, project reuse/creation, scoped secret configuration, Firewall rules, preview deployment and live acceptance using docs/launch-runbook.md. Only successful live acceptance permits promotion.

GitHub source push/PR results are recorded in docs/progress.md or the task response. Repository changes alone are not a live release.

## Final local totals

- Clean locked installation, including the Vercel-style production install with explicit dev build dependencies: passed.
- ESLint: passed; TypeScript: passed; production build: passed.
- Domain/authorization: **22 passed, 0 failed**.
- Production/operations: **11 passed, 0 failed**.
- Browser/local Appwrite fixture: **27 passed, 0 failed** across desktop/tablet/mobile.
- Actual deployed Appwrite/Auth/Firewall/two-user tests: **unrun / blocked**, not passed.
- No live website URL or production deployment is claimed.
