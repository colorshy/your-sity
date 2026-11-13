# Your City

City communities for Shymkent. Milestones 1–2: cloud-ready Next.js foundation and **demo-only** responsive Kazakh/Russian UI. No real accounts, news, membership persistence, publishing, or moderation yet.

## Development

Node.js 22+ (validated with 24.22.1), npm 11. From the existing checkout:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the running app on port 3000 through your development environment. Routes: `/`, `/feed`, `/communities`, `/communities/events`, `/profile`, `/sign-in`, `/sign-up`, `/onboarding`, `/create`, `/about`.

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

In Codex Cloud, use the preinstalled browser: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`. Downloading bundled browsers may require allowing `cdn.playwright.dev` in environment settings.

Browser tests start an isolated development server on port 3100. Language preference is stored in localStorage; demo membership resets on page navigation. No Supabase credentials needed for this phase. UI forms intentionally disabled.

## Configuration

`.env.example` declares future public Supabase configuration. Copy to `.env.local` only when implementing milestone 3. Never commit secrets or use a service-role key in browser code. See [deployment](docs/deployment.md), [architecture](docs/architecture.md), and [progress](docs/progress.md).
