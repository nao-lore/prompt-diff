# Prompt Diff

> Send the same prompt to Claude, GPT, and Gemini at the same time. Compare output, latency, tokens, and estimated cost in a single 3-column view.

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](https://github.com/nao-lore/prompt-diff/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

<!-- Demo GIF placeholder — record once a real Vercel deployment is live. -->

![demo](./docs/demo-placeholder.png)

## What & Why

Comparing LLM outputs side by side is a recurring chore for anyone writing about models. The
existing options are: open three tabs, paste the same prompt, hand-format the results, hope you
spelled the model name right.

Prompt Diff is the smallest possible app that fixes that loop:

- One prompt input.
- Three streaming outputs in parallel.
- Real latency / token / cost numbers per column.
- A share URL and a "Copy as Markdown" button so the comparison is one click away from a draft article.

It is intentionally not a chat product. There is no thread, no system prompt store, no model
playground. Adding any of those would mean less time on the comparison loop.

## Features

- **3-column compare view** — Anthropic / OpenAI / Google, model dropdown per column, model selection survives across runs.
- **Streaming via Vercel AI SDK** — `streamText` per provider, real-time per-column output.
- **Real cost estimates** — hardcoded snapshot of every supported model's per-1M-token pricing.
- **Share URLs** — every run is persisted to Supabase and addressable at `/compare/[id]`.
- **Markdown export** — Zenn-ready format with prompt blockquote, per-provider sections, and a meta table.
- **⌘/Ctrl + Enter** to run the prompt without leaving the textarea.
- **Provider abstraction** — adding a fourth provider is one new file in `src/lib/providers/` and one line in the registry.

## Tech Stack

| Layer           | Choice                                                       | Why                                                                                                |
| --------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                                      | Server Components + native streaming + route groups for the marketing/app split.                   |
| Language        | TypeScript (strict)                                          | Catch shape errors at the seam between providers, schemas, and the DB.                             |
| Styling         | Tailwind CSS v4 + shadcn-style primitives                    | Hand-rolled Button/Textarea/Card. Radix would be three primitives' worth of weight for no benefit. |
| LLM SDK         | Vercel AI SDK v6 (`ai`, `@ai-sdk/{anthropic,openai,google}`) | One streaming API across providers. `streamText` keeps the route handler tiny.                     |
| DB              | Supabase (Postgres)                                          | Two tables, RLS-public read, no auth in MVP. Free tier covers everything.                          |
| Validation      | zod                                                          | Used for env vars (lazy, server/client split) and the API wire schema.                             |
| Tests           | Vitest                                                       | Fast, native TS, plays well with `vi.mock` for the SDK packages.                                   |
| Lint / Format   | ESLint + Prettier + Husky + lint-staged                      | Pre-commit hook keeps the diff clean.                                                              |
| Deploy          | Vercel                                                       | Default for any Next.js project; Fluid Compute is a great fit for the streaming route handler.     |
| Package manager | pnpm                                                         | Fast, disk-efficient, deterministic.                                                               |

## Architecture

```
src/
├── app/
│   ├── (marketing)/page.tsx        # Landing
│   ├── compare/page.tsx            # Main 3-column view
│   ├── compare/[id]/page.tsx       # Public share view (Server Component)
│   ├── api/run/route.ts            # Streaming endpoint (one model per request)
│   └── api/comparisons/route.ts    # Persistence endpoint
├── components/
│   ├── ui/                         # Button, Textarea, Card primitives
│   └── compare/                    # PromptInput, ResultColumn, MetaInfo, ...
└── lib/
    ├── providers/                  # LLMProvider abstraction + 3 implementations
    ├── db/                         # Supabase client + queries
    ├── env.ts                      # zod validation, lazy proxy
    ├── result.ts                   # Result<T, E> + helpers
    ├── pricing.ts                  # Per-model price table + calculateCost
    ├── streaming.ts                # /api/run wire format
    ├── markdown.ts                 # Markdown export formatter
    └── run-client.ts               # Client-side stream consumer
```

The four design judgements that shaped this layout are written up in [`docs/adr/`](./docs/adr/):

1. [App Router over Pages Router](./docs/adr/0001-nextjs-app-router.md)
2. [Vercel AI SDK over per-provider SDKs](./docs/adr/0002-vercel-ai-sdk.md)
3. [Provider abstraction shape](./docs/adr/0003-provider-abstraction.md)
4. [No authentication in the MVP](./docs/adr/0004-no-auth-in-mvp.md)

Higher-level architecture notes — request flow, RSC↔client boundary, error handling — are in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable pnpm`)
- API keys: Anthropic, OpenAI, Google AI Studio
- A Supabase project (free tier)

### Setup

```bash
git clone https://github.com/nao-lore/prompt-diff.git
cd prompt-diff
pnpm install
cp .env.example .env.local
# Fill in the keys in .env.local
```

Apply the migration:

```bash
# Option A: Supabase CLI
supabase link --project-ref <your-project-ref>
supabase db push

# Option B: paste supabase/migrations/0001_initial.sql into the SQL editor
```

Then run the dev server:

```bash
pnpm dev
# → http://localhost:3000
```

### Scripts

| Command              | Description                 |
| -------------------- | --------------------------- |
| `pnpm dev`           | Run the dev server          |
| `pnpm build`         | Production build            |
| `pnpm start`         | Start the production server |
| `pnpm lint`          | ESLint                      |
| `pnpm format`        | Prettier write              |
| `pnpm typecheck`     | `tsc --noEmit`              |
| `pnpm test`          | Vitest (single run)         |
| `pnpm test:watch`    | Vitest (watch mode)         |
| `pnpm test:coverage` | Coverage report (v8)        |

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

All variables are validated at startup via `src/lib/env.ts` (zod, lazy proxy, server/client split).

## Project Structure

| Path                      | Role                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `src/app/(marketing)/`    | Landing page (route group; the URL is still `/`)                 |
| `src/app/compare/`        | The main and shared compare views                                |
| `src/app/api/`            | Route handlers — `run` (streaming) + `comparisons` (persistence) |
| `src/components/ui/`      | Hand-rolled shadcn-style primitives                              |
| `src/components/compare/` | Compare-view-specific UI                                         |
| `src/lib/providers/`      | Provider abstraction + Anthropic/OpenAI/Google implementations   |
| `src/lib/db/`             | Supabase client + query layer                                    |
| `tests/`                  | Vitest unit tests, mirrors `src/lib/` and `src/components/`      |
| `supabase/migrations/`    | SQL schema migrations                                            |
| `docs/adr/`               | Architecture Decision Records                                    |

## Design Decisions

See [`docs/adr/`](./docs/adr/). The four ADRs explain why this project uses the App Router, why
provider calls go through the Vercel AI SDK rather than each vendor's SDK directly, the shape of
the provider abstraction, and why the MVP has no authentication layer.

## Roadmap

- **v1.1** — Auth + per-user run history (Supabase Auth + RLS).
- **v1.2** — Prompt templates and presets.
- **v1.3** — LLM-as-a-Judge automatic scoring across columns.
- **v1.4** — Local model support (Ollama / LM Studio).

## License

MIT
