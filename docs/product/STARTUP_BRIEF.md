# YOUR CITY — Startup & Product Brief
**Status:** founder-approved direction / working hypotheses, 15 November 2026  
**City for pilot:** Shymkent, Kazakhstan  
**Product:** mobile-first city social network (web MVP today; native app decision later)
## 1. One-sentence description
**Your City — единая городская социальная платформа**, в которой житель может перейти между сообществами, читать общую ленту, публиковать сообщения, находить людей по интересам и участвовать в локальных обсуждениях.
This is **not only** a local-news website, classifieds board, messaging clone or student-only app.
**One city. One community. One platform.** (working positioning; not validated with users)
## 2. Problem hypothesis / Почему пользователь откроет Your City?
Existing city information and conversations are fragmented across many Telegram/WhatsApp groups and social-media pages. A user may have to join many chats and search noisy history to discover relevant topics; Your City proposes discoverable communities, a unified city feed, transparent discussion threads, and easy switching between interests without joining every chat to browse.
**Important:** product differentiation and regular usage are *hypotheses*, not proven facts. The platform must give contributors a reason to publish when their audience is still on established platforms.
## 3. Target audience & rollout
- **First cohort:** university students in Shymkent, starting with a single connected university/campus community. Founder identified M. Auezov South Kazakhstan University as a practical candidate.
- **Second cohort:** other Shymkent students and adjacent interest-based communities; do not expand until engagement is observed.
- **Later:** residents, districts, cafés, local businesses, drivers, events and other Kazakhstan cities. These are expansion options, not launch requirements.
- Founder prefers a *mobile app* as eventual primary product. Current Next.js responsive web experience is adequate for early research, demos and potentially installable/mobile beta; native iOS/Android development is a separate decision, not an assumption that a website must fail.
## 4. Core usage loops
1. **Discover:** open Shymkent city feed; discover communities and useful posts across them.
2. **Join/Follow:** join a student/interest community, follow another account (asymmetric follows).
3. **Participate:** ask questions, post news/opinions, reply in threaded discussions, quote/share.
4. **Return:** see fresh local conversations and relevant activity/notifications.
5. **Trust:** report problems; mute/block accounts; consistent moderation and privacy controls.
Example practical content: student questions, campus life, Shymkent cafés and discounts, city events, local road updates, interests, neighborhood conversations. Do not portray fiction as current news.
## 5. Lessons from founder-supplied NotebookLM notes
These are **research themes to test**, not independently fact-checked historical evidence. Original NotebookLM numbered citations [1]–[103] were supplied *without a bibliography or source URLs*:
- **Facebook:** dense launch within one university/campus; people recognize one another.
- **Twitter:** quick short-form posts, real-time discussion, follow model.
- **Reddit:** interest communities, active curation, voting/discussion; seed content transparently, **not** with fake members/accounts.
- **Threads:** frictionless onboarding and distribution matter; registrations alone don't prove retention. Do not promise effortless import of messenger contacts: privacy, platform authorization and technical permission matter.
- **MySpace:** avoid UI clutter, intrusive ads and poor performance.
- **Google+:** do not force adoption; prove genuine repeated use and an original reason to visit.
## 6. What exists in Your City 2.0
Branch `feat/social-mvp-2` includes a public labeled demo: three feeds (For You, City, Communities), filters by content type and district; posts/images; threaded replies; quotes/shares; user profiles/tabs/follows; notifications; local report/mute/block; RU/KZ; light/dark; responsive down to 320px. Demo state and interactions remain **in one browser** (localStorage/session memory); separate users are NOT communicating in real time.
The repository also contains **real Appwrite-backed account/content routes**, but their real multi-user end-to-end compatibility with live permissions has not been verified by demo tests. Do not treat test suites or a READY Vercel build as proof of live readiness.
## 7. Technology constraints
- Keep **Next.js + TypeScript + Tailwind**, established repo architecture, current Appwrite project/database and Vercel connection.
- Preserve existing real auth/content security and RU/KZ localization.
- No backend/provider swap; no paid AI APIs or speculative infrastructure rebuild.
- Protect data: server-only secrets; ownership and moderation checks on server; no precise GPS, contact scraping, shadow profiles or unauthorized messenger import.
- Appwrite live read/write validation and cross-user tests are separate release gates before real pilot.
## 8. MVP / product priorities
### Must-have for a real closed beta
Email/auth/onboarding, city feed, discoverable communities, posts and threaded comments, profile, basic follows/notifications, report/mute/block, simple moderation, RU/KZ and mobile usability. Ensure cross-user persistence and permissions. The existing demo proves UI interactions, **not** this release gate.
### Wait until validated
Paid subscriptions, ads, marketplace transactions, direct messaging, complex matching/dating, full map integrations, city-wide government workflows, native apps, machine-learning personalization, multi-city rollout. Do not expand scope based on imagined demand.
## 9. Experiment: Student Beta (proposed, not approved metrics)
- Pilot target: **~30 consenting students**, **14 days**, one connected campus/community. Numbers are starting assumptions and adjustable.
- Seed ~15–20 genuine and clearly attributed helpful posts/discussions from organizers and willing participants, with no invented engagement.
- Observe: activation (joined/read/replied), weekly active users, **7-day retention** (returned on/after day 7 by an explicit definition), post and reply contributors, conversations getting replies, community switching/discovery and user interviews.
- Look for people returning and interacting *without founder reminders*. Track denominator and sample size; do not claim statistical significance from ~30 people.
- Respect consent/privacy and avoid coercion to participate.
## 10. Risk register and responses
- **Empty feed / cold start:** curated authentic content + a narrow student cohort.
- **Weak network effects / friend referrals:** measure actual return and conversation, not signups from courtesy.
- **No unique recurring value:** ask users to compare real tasks with existing Telegram/Instagram options; check revealed behavior.
- **Content supply:** recruit real student contributors and local community hosts; do not assume businesses will cross-post.
- **Scope overload:** ship only core loop; gate later features on user requests and evidence.
- **Spam, scams, abuse, trust:** reports, moderation policies, minimum-risk role design and transparent enforcement; moderation needs trained people as well as code.
- **Privacy/legal:** data minimization, notices and compliance review appropriate for Kazakhstan before collecting real-user data at scale.
- **Performance:** verify security and load in live multi-user testing; a database purchase alone does not establish capacity.
- **Monetization:** optional subscriptions/local business tools are exploratory; do not charge or develop billing before value is demonstrated.
- **Premature expansion:** validate one cohort and one city first.
## 11. Decisions and open questions
**Decisions:** Shymkent first; students first; one discoverable city platform with communities; clean X/Reddit/Threads-inspired UX; RU/KZ; build on current Next.js/Appwrite; demo-first recommendation experiments; strict moderation intent; no production release without live acceptance.
**Open questions:** what recurring task creates a weekly habit? Who supplies daily useful posts? What motivates community hosts? What is the true beta activation/retention benchmark? Native app vs responsive/PWA after beta? How to fund moderation? Answer through experiments, not assumptions.
## 12. Next build task
See [RECOMMENDATIONS_V1.md](./RECOMMENDATIONS_V1.md) for deterministic and explainable For You ranking in the existing demo and [CODEX_TASK.md](./CODEX_TASK.md) for implementation instructions.
