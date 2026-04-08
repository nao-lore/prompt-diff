# Prompt Diff

> Send the same prompt to Claude / GPT / Gemini side by side. Compare output, latency, tokens, and estimated cost in a single 3-column view.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

## Tech Stack

- **Framework**: Next.js 16 (App Router) — Server Components + streaming
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **LLM SDK**: Vercel AI SDK (`ai`) — provider abstraction + streaming
- **DB**: Supabase (Postgres) — comparison history
- **Validation**: zod
- **Test**: Vitest
- **Package manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable pnpm`)
- API keys for Anthropic / OpenAI / Google AI Studio
- A Supabase project (free tier is fine)

### Setup

```bash
git clone https://github.com/nao-lore/prompt-diff.git
cd prompt-diff
pnpm install
cp .env.example .env.local
# Fill in the keys in .env.local
pnpm dev
```

Open <http://localhost:3000>.

### Scripts

| Command           | Description                 |
| ----------------- | --------------------------- |
| `pnpm dev`        | Run the dev server          |
| `pnpm build`      | Production build            |
| `pnpm start`      | Start the production server |
| `pnpm lint`       | ESLint                      |
| `pnpm format`     | Prettier write              |
| `pnpm typecheck`  | `tsc --noEmit`              |
| `pnpm test`       | Vitest (single run)         |
| `pnpm test:watch` | Vitest (watch mode)         |

## Environment Variables

See [`.env.example`](./.env.example).

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `ANTHROPIC_API_KEY`             | Anthropic API key                       |
| `OPENAI_API_KEY`                | OpenAI API key                          |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | Google Generative AI (Gemini) API key   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server only) |

All variables are validated at startup with [zod](https://zod.dev) (see `src/lib/env.ts`, added in PR #2).

## Database (Supabase)

Run the migration against your Supabase project once:

```bash
# Option A: Supabase CLI (recommended)
supabase link --project-ref <your-project-ref>
supabase db push

# Option B: Paste into the SQL editor
cat supabase/migrations/0001_initial.sql
# → Supabase Dashboard → SQL editor → New query → paste → Run
```

The schema is two tables (`comparisons`, `results`) with public read RLS so the
share URL works without authentication. All writes go through the service role
key on the server. See `src/lib/db/queries.ts` for the query layer.

## Project Status

This project is being built in [10 PRs](./CLAUDE.md#pr-分割計画この順番で進める). PR #1 (this PR) sets up the toolchain only.

## License

MIT
