# Deployment readiness — Appwrite

The repository uses Next.js App Router and a Node server runtime suitable for Vercel. Node >=22.19 is required (validated 24.22.1). Install with npm ci and build with npm run build.

The Appwrite backend is managed by ChatGPT through a separate integration. Coordinate its actual schema/index/permission and platform settings using BACKEND_REQUIREMENTS.md. The application requires a scoped server-only APPWRITE_API_KEY and the existing endpoint/project/database IDs in .env.example. Never put the key in NEXT_PUBLIC, client bundles or Git. Configure NEXT_PUBLIC_SITE_URL to the exact trusted application origin and register the corresponding Appwrite platform/verification hostname.

Production uses a Secure __Host- session cookie. Use HTTPS. Set server-only moderator Account IDs explicitly, and configure appropriate deployment abuse limits for auth/content actions (API-key-backed provider requests must not be assumed to inherit anonymous rate limits). Metadata checks must succeed before enabling real app writes; do not remove them to make an incompatible backend appear ready.

No Vercel deployment, Appwrite live acceptance or Codex environment publication is claimed. The existing cloud publication issue is independent of authorized feature development. Browser fixtures/local authorization tests do not replace a hosted two-user acceptance run. Existing branches and historical work are preserved; no force pushes or automatic merges.
