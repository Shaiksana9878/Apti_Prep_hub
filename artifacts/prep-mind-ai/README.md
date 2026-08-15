# PrepMind AI

PrepMind AI is an AI-powered exam preparation companion for any exam. It creates a focused preparation plan, generates practice questions, teaches syllabus topics, answers study doubts, and tracks progress in one responsive dark workspace.

## Run locally

```bash
pnpm install
pnpm run dev
```

The app expects `ANTHROPIC_API_KEY` to be available to the server environment. The key is used only by `api/claude.js` and is never sent to the browser.

## Deploy to Vercel

From this directory:

```bash
vercel
```

Add `ANTHROPIC_API_KEY` as a Vercel environment variable for the environments where the app will run, then deploy again.

The frontend is intentionally a single `index.html` file with inline CSS and vanilla JavaScript. The `/api/claude` serverless function validates requests, calls Claude with the server-side key, and returns a safe text response.