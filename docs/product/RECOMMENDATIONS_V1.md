# Your City — Explainable Recommendation Engine v1 (Demo)
**Implementation stage:** proposed feature; NOT a deployed/live algorithm  
**Baseline inspected:** `src/lib/social-demo.ts::visiblePosts` on `feat/social-mvp-2`. Current `explore` score is community membership +20; followed author +8; a timestamp component; local like +2; own comments +1. The City tab sorts chronologically. This spec extends that existing demo logic, rather than replacing architecture or starting an AI platform.
## 1. User goal
Help a Shymkent resident find relevant local conversations, including some communities **not yet joined**; prioritize real interaction over artificial popularity. Preserve clear **For You / City / Communities** boundaries. The demo must remain truthful: no cross-user intelligence, no backend API and no fake popularity.
## 2. Feed semantics — do not blend
- **For You (existing `mode="explore"`):** explainable deterministic ranking for posts from all browseable city communities; includes new-community discovery.
- **City (existing `mode="city"`):** chronological order and existing kind/district filters. No recommendation reordering.
- **Communities / Mine (existing `mode="mine"`):** only posts in joined communities, newest first unless existing UI specifies otherwise. Keep semantic compatibility.
- **Search / district / kind:** filtering, mute/block and authorization checks happen BEFORE scoring; never show blocked/muted authors or filtered content.
- **Posts/detail/profile/saved:** preserve existing ordering and filtering rules. Do not apply For You ranking to unrelated contexts.
## 3. Signals permitted in *demo*
Use **only data already in browser:** joined communities (`state.joined`), followed authors (`state.following`), local likes (`state.likes`), local comments (`state.comments`), saved posts (`state.saved`), optional broad district selected by user (`state.profile.neighborhood`), post kind/community, timestamps and own posts. Do **not** use fake seed `likes` counters, simulated engagement, precise GPS, device identifiers, external user data or external model calls. Seed author names/posts are fictional and labeled.
## 4. Proposed transparent scoring — tuneable example weights, not proven
For post p and current demo viewer:
- +14 if p belongs to a joined community
- +10 if author is followed
- +5 if viewer has liked p (optional; avoid looping same items endlessly)
- +4 if viewer has saved p (optional, test usefulness)
- +3 if viewer has *actually* commented on p (count max 1 signal per post; not number of replies)
- +4 if p is in the broad district voluntarily entered in profile; **only if user explicitly set it**, no inferred location
- recency +[0..10] e.g. `10 * exp(-ageHours / 72)` using explicit stable `now` input; never future timestamps rewarding extra recency; invalid dates score zero
- +2 *bounded* discovery boost for a community not joined, to avoid an all-joined echo chamber. Discovery ideally applied as feed-level mixing, not arbitrary popularity.
Weights are **illustrative**; expose as named constants in `src/lib/recommendations.ts`, not embedded magic values. Avoid `Date.now()` in pure tests; accept a deterministic `now` from caller. Do not use seeded like count or claims of ML personalization.
## 5. Diversity & cold start
- **Cold start:** with empty follows, joined communities and interactions, show varied recent posts from multiple communities; return useful and deterministic results instead of blank feed.
- **Diversity:** cap same-author or same-community streak at **2 posts** when alternatives are available. Preserve meaningful ranking as much as possible; stable ties (timestamp DESC then post ID).
- **Exploration:** aim for at least 1 discoverable post among first 5 if enough non-joined communities exist. Do not force if unavailable.
- **Self-posts:** no special personal boost or suppression unless clear UX need; avoid self-posts dominating a feed.
- **Freshness:** use supplied timestamps, not a permanently anchored seed date. Demo content has fixed historical dates; treat it as demo, not breaking news.
- **Safety:** block/mute and moderation states have strict priority over rank. Never rank hidden content back in.
## 6. User transparency
Optional small RU/KZ labels such as `Из вашего сообщества / Қауымдастығыңыздан`, `Вы подписаны на автора / Авторға жазылғансыз`, `Рядом с вашим районом / Сіздің ауданыңызда` (only broad user-selected district), `Новое сообщество / Жаңа қауымдастық`; never suggest true GPS proximity, live data, or unknown behavior. Do not materially disrupt the existing minimalist cards or 320px layout.
## 7. Code design
- Add **pure TypeScript** module `src/lib/recommendations.ts` exposing a ranking function and optionally a reason selector; no Next server route and no external package.
- Integrate it only with `visiblePosts` For You path (or equivalent) in `src/lib/social-demo.ts`; preserve existing `visiblePosts` call signature and City/Mine contracts. Existing `src/components/city-app.tsx` currently passes `mode: page === "feed" ? mode : "city"`.
- Keep state in existing `DemoState`. No migration unless absolutely required; do not reset `your-city-demo-v2` or damage prior locally saved user posts/comments.
- If a reason appears visually, keep localization in existing RU/KZ pattern and accessibility, with a tiny unobtrusive label. No explanations if they make the UI noisy; tests matter more.
- Pure ranking should be easy to port to a future server-side feed once real multi-user storage is validated.
## 8. Tests / acceptance
- No change to City chronology, My Communities filtering, search/kind/district filters.
- Ranked posts are deterministic for same state/posts/now; stable tie order.
- Likes/follows/joins alter **For You** in a measurable, explainable way.
- Fresh posts get reasonable recency weight; old post is not awarded bonus due to stale seed timestamps.
- Cold start stays useful and includes multiple topics when available.
- Block/mute exclude authors before ranking; no interaction can unhide them.
- Author/community diversity when enough alternatives exist.
- Seed popularity numbers never count as real engagement.
- RU/KZ and 320px UI unaffected; no unexpected localStorage migration.
- Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:social`, `npm run test:security`, and relevant Playwright tests; document results and gaps.
## 9. Explicit exclusions
Do **not** ship machine learning, vector embeddings, trackers, third-party personalization APIs, geolocation permissions, persistent behavioral analytics, push notifications, real-user recommendation API, paid infrastructure, or Appwrite migrations as part of this task. A true production recommender is future work after ethical data collection, privacy/legal review, measured retention and backend validation.
