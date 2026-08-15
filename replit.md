# PrepMind AI

PrepMind AI is a dark, focused exam-preparation studio that creates personalized plans, practice questions, guided lessons, doubt-solving chat, and live progress tracking for any exam.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/prep-mind-ai/index.html` — complete vanilla frontend, including inline CSS and JavaScript state
- `artifacts/prep-mind-ai/api/claude.js` — Vercel serverless AI proxy
- `artifacts/prep-mind-ai/vercel.json` — Vercel build and function configuration
- `artifacts/api-server/src/routes/claude.ts` — Replit preview route for the same `/api/claude` contract

## Architecture decisions

- The browser app remains a single `index.html` with no frontend framework, matching the deployment brief.
- AI credentials are used only by server-side handlers; the client calls `/api/claude` and never receives the key.
- The app keeps a complete local fallback for exam plans, practice, lessons, and chat so the study flow remains usable when AI is unavailable.

## Product

- Any exam name can be turned into a personalized study plan.
- Five dashboard areas support overview, practice, teaching, doubt solving, and progress review.
- Practice answers update score, accuracy, topic performance, difficulty performance, and recent activity immediately.

## User preferences

- Keep the main app as a single vanilla `index.html`; do not replace it with React or another frontend framework.

## Gotchas

- `/api/claude` is served by the shared API service in Replit preview and by `api/claude.js` when deployed directly to Vercel.
- AI requests need a funded Anthropic account; offline fallbacks are intentional and should remain available.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
