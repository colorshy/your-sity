# Architecture

Next.js App Router + strict TypeScript + React, Tailwind 4, Lucide. No external font or image requests required. Vercel-compatible Node runtime.

Server route wrappers validate community IDs. CityApp is the interactive demo shell: navigation, locale selection, search, membership simulation and feed filtering. Demo fixtures are centralized in src/lib/demo.ts. Language is a two-locale external browser store with Kazakh server fallback; document language follows selection. Membership is deliberately ephemeral and never presented as persisted.

Before database integration split CityApp into feature components, extract typed locale catalogs, add Supabase browser/server factories with @supabase/ssr, session refresh, protected server routes and server actions. Server actions must validate inputs and derive identity from verified Auth claims. PostgreSQL RLS is the authority for authorization, not hidden UI controls. Current routes are public demo pages, not protected real-user pages.

Database and authentication are not implemented in milestones 1–2. Supabase dependencies are installed for the next phase without creating fake clients or credentials.
