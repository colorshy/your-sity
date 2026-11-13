# Working on Your City

Use the existing isolated checkout; do not create a worktree unless explicitly requested. Preserve user changes. Use Node 22+ and npm with package-lock.json; install with npm ci. In Codex Cloud use `--cache /workspace/.npm-cache` when the home cache is unavailable.

App Router routes live in src/app, shared UI in src/components, fixtures in src/lib/demo.ts. TypeScript strict mode, functional React components, Tailwind 4 and shared CSS tokens. Format with `npm run format`. Use semantic controls, visible focus, accessible names, and mobile-first layouts. Maintain Kazakh and Russian parity; English is future work. Move growing translations to typed catalogs in milestone 3.

Before finishing run npm run lint, npm run typecheck, npm run build, npm test. Browser setup: npx playwright install chromium; in this cloud environment use PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test instead (browser download is blocked by policy). Distinguish executed checks from blocked checks. Update docs/progress.md after each milestone.

Do not commit .env files, tokens, generated builds, node_modules, or screenshots. No service-role key in clients. Demo content must remain explicitly labeled; never imply authentication or database writes work before integration and authorization tests pass. GitHub is source of truth, but do not claim push/deployment without verification. No messaging, payments, advanced maps, recommendations or native apps in MVP.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Appwrite conventions

Use node-appwrite from server code only; current backend IDs are in .env.example. CityService owns identity/city/member/ownership validation; AppwriteRepository maps inspected metadata. Table/row grants and schema must match BACKEND_REQUIREMENTS.md before writes. Every protected action validates Account.get; cookies alone are not authentication. All actor fields/roles are derived on the server. Private profile data must never leak through author projection. Transactions must fail closed, not fall back to unprotected writes.

Run npm run lint, npm run typecheck, npm run build, npm run test:security, and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test. The browser fixture is local only and is not real Appwrite evidence. No Appwrite MCP is available in this Codex session: do not repeatedly probe the blocked live API or ask the founder for backend administration. ChatGPT's separate integration handles live schema/permission changes; update BACKEND_REQUIREMENTS.md with precise operations. Never recreate existing tables/records. Supabase is inactive historical work under docs/legacy-supabase and on its own branch. Publication is not a prerequisite to this authorized development.
