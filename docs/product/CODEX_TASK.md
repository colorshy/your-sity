# CODEX TASK — YOUR CITY MVP 2.1: Product Documentation + Recommendation Engine
## Context
Repository: https://github.com/colorshy/your-sity
**Base branch:** `feat/social-mvp-2` (commit `7c5998db4d15d0ecdd90552e3b76987b956c8780`).
**Planning branch:** `feat/product-brief-recommendations`.
Product decisions are documented in:
- `docs/product/STARTUP_BRIEF.md`
- `docs/product/RECOMMENDATIONS_V1.md`
Read these **before** changing code. Do not create duplicate conflicting product briefs.
## Objective
Improve the existing **For You** demo feed using a deterministic, explainable ranking system, preserving the clean Your City 2.0 user experience. This is a technical implementation task on the EXISTING GitHub repository, NOT a request to create a new product, cloud workspace, service, model or infrastructure.
## Required work
1. Inspect existing code and reuse it: `src/lib/social-demo.ts` (`visiblePosts` currently computes scores), `src/lib/demo-store.ts`, `src/lib/demo.ts`, `src/components/city-app.tsx`, current tests and UX. Describe the baseline briefly in your final report.
2. Create a pure, type-safe `src/lib/recommendations.ts` with reusable deterministic scoring and stable sorting. Build on the existing scoring signals — joined communities, followed authors, actual local likes/comments/saves, recency, optional user-chosen broad district — plus a **lightweight diversity/exploration** mechanism for unfamiliar communities. Weights in the spec are suggested starting points; favor simple UX and correctness.
3. Keep City chronological and joined Communities chronological. Never let recommendation score override blocked/muted, search, neighborhood/type filters or user privacy settings. Do not treat fake demo seed engagement as real.
4. Ensure useful cold start for an empty account; ensure predictable behavior when posts have invalid/future timestamps and after users interact. Do not introduce nondeterministic/unstable sort behavior or heavy dependencies.
5. If a small, localized RU/KZ "Why am I seeing this?" / recommendation reason improves UX, it may be added unobtrusively, respecting mobile 320px and keyboard accessibility. Do not make UI cluttered.
6. Add unit/social tests for monotonic interaction signals, cold start, source diversity, exclusions, stable sort, and unchanged existing views. Preserve existing `your-city-demo-v2` browser storage and migrated demo content.
7. Update relevant `docs/product` files only when decisions/implementation change; record open issues and the fact this is still **browser-local demo functionality**, not an ML production service.
8. Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:social`, `npm run test:security`, and available browser tests. If an environment prevents running a check, report precisely; do not claim it passed.
## Non-goals and safety
NO deployment to Production. NO new cloud projects/services. NO Appwrite database migrations/API keys; existing Appwrite real-account routes must stay intact. NO third-party AI APIs, embeddings, user tracking, IP-based or precise location inference, unauthorized Telegram/WhatsApp user import, hidden fake activity, subscriptions, payments, or new city support. NO rewriting the app or redesigning the profile.
## Deliverables
- New TypeScript recommendation module + minimal integration into existing For You demo feed.
- Regression and ranking tests.
- Documentation in `docs/product`.
- Push implementation to a new feature branch based on the planning branch, e.g. `feat/recommendations-v1`; create a draft PR against `feat/product-brief-recommendations` if available.
- At completion report: changed files, algorithm in plain language, tests actually run, limitations, commit/PR URL and preview steps.
## Definition of done
Tests green, For You ranking predictable/relevant/diverse, no regression of City/Communities modes, no loss of local demo state, user interactions still explicitly demo-only, no production deployment. Review before merge or live beta.
