Improves the real-account community discovery, onboarding and text-publishing experience while retaining the existing Appwrite authorization and transactional write paths.

- Instant bilingual name/description search, existing category filters, membership status, reset/empty states and responsive cards. Reads retain the existing city-scoped 100-row bound, disclosed at the limit.
- RU/KK registration/onboarding guidance and optional selection of actual available communities.
- Mobile text composer with 5,000-character counter, whitespace validation and localized pending/disabled submission state.
- Read-only category projection and regression tests for onboarding guards, discovery, membership ownership display and composer validation.
- Photo uploads remain unavailable; exact backend requirements are documented. No migrations, permission changes, production deployment or Vercel configuration changes.

Validation results are recorded in docs/progress.md. Hosted Appwrite verification, an immutable Vercel Preview and real two-user acceptance remain separate release gates; this PR does not declare beta readiness.

Local checks: lint, typecheck and production build passed; security 32/32, social 28/28, migration 9/9 and operations 12/12 passed. The complete browser run passed the 60 existing cases; the three new cases initially had a test-only counter expectation error and passed 3/3 after correction on tablet, desktop and mobile.
