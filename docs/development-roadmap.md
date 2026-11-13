# Development roadmap

1. Foundation: Next.js, TypeScript, Tailwind, lint, reproducible lockfile, docs and env template.
2. Responsive demo: landing, feed modes, community discovery/detail, auth/onboarding/create layouts, profile, kk/ru and empty/loading/error states.
3. Supabase: migrations, constraints, RLS, SSR authentication, verified sessions, protected routes, onboarding and typed translation catalogs; database integration tests.
4. Persist community memberships and personalized newest-first feeds; pagination and cross-city checks.
5. Real posts/comments, ownership deletion, reports and moderator queue; test unauthorized access.
6. Full integration/accessibility checks, staging Vercel deployment, production configuration and verified GitHub workflow.

Current scope ends at 2. No payment, direct messaging, advanced maps, native mobile, ads, or complex recommendations.

## Appwrite continuation

The current user explicitly selected Appwrite and assigned live backend administration to ChatGPT's separate integration. This supersedes the previous Supabase implementation roadmap. Active work is on feat/milestone-3-appwrite: Auth, onboarding, communities/memberships, content CRUD, feed and moderation foundation. Next acceptance milestone is schema/permission reconciliation and live two-user verification using BACKEND_REQUIREMENTS.md, then deployment/abuse controls and cursor pagination for larger datasets. No return to Supabase is planned.
