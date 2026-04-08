# Architecture

This is the high-level "how it fits together" doc. Per-decision rationale lives in
[`docs/adr/`](./docs/adr/); this file is the orientation read.

## Request flow

```
Browser
  │
  │ POST /api/comparisons   ┌─────────────────────────────────────┐
  │ ────────────────────── ▶│  Validate (zod) → createComparison  │
  │                         │  → saveResults → { id }             │
  │                         └─────────────────────────────────────┘
  │
  │ POST /api/run           ┌─────────────────────────────────────┐
  │ ────────────────────── ▶│  Validate (zod)                     │
  │                         │  getProvider(id).getModel(modelId)  │
  │                         │  streamText({ model, prompt })      │
  │                         │  ReadableStream:                    │
  │                         │    pipe textStream chunks           │
  │                         │    on usage: emit META sentinel     │
  │                         └─────────────────────────────────────┘
  │ ◀──────── text/plain stream + sentinel + JSON metadata
  │
  │ runStream (lib/run-client.ts)
  │   buffers chunks, splits on META sentinel,
  │   raises onText for visible text, returns metadata
  │
  ▼
CompareView (client island)
  fans out 3 parallel runStream calls,
  per-column state machine: idle → streaming → done | error
```

## Layers

### `src/lib/providers/`

The seam that lets us add a 4th model with one new file. `LLMProvider` is the server-side
interface (id, displayName, defaultModel, availableModels, `getModel(modelId)`). `ProviderInfo`
strips the function-valued field so a Server Component can hand it to a Client Component without
hitting the "functions can't cross the RSC boundary" wall.

The registry in `index.ts` is the only place that knows about all three providers. Tests mock
the AI SDK provider packages with `vi.mock` and verify that `getModel` calls through with the
correct model id.

### `src/lib/env.ts`

zod validation with two schemas (server, client) so server-only keys are never validated on the
browser branch where they're not available. The exported `env` is a `Proxy` so the first
property access triggers validation; tests can call `__internal.parseEnv()` directly without
dealing with module-load timing.

### `src/lib/result.ts`

`Result<T, E>` discriminated union. Used by the DB query layer so callers (route handlers, share
page) can decide how to map errors to HTTP status codes without unwrapping a thrown surprise.
`tryCatch` / `tryCatchAsync` wrap external code at boundaries.

### `src/lib/db/`

`client.ts` is a lazy singleton over the Supabase service-role client (server-only). `schema.ts`
hand-writes the row types so the `provider` column can be narrowed to the `ProviderId` union
(codegen would only know "text"). `queries.ts` is the only allowed surface — components and
route handlers never construct the Supabase client themselves.

### `src/lib/streaming.ts`

The wire format for `/api/run`. Sentinel-delimited metadata. The sentinel is `\u0000__META__\u0000`
(NUL-prefixed, so it cannot collide with normal model output). Both the server (`serializeMetadata`)
and the client (`runStream`) reference this constant; tests pin the round trip.

### `src/components/compare/`

Three layers of components:

1. **Server entry** — `src/app/compare/page.tsx`. Pulls `getAllProviderInfos()` and hands it to the client island.
2. **Client island** — `compare-view.tsx`. Owns prompt, columns, isRunning, shareId, lastRun, AbortController. Fans out three `runStream` calls.
3. **Per-column views** — `result-column.tsx`, `meta-info.tsx`, `model-selector.tsx`. Pure render given a state slice.

The share view (`/compare/[id]`) bypasses the client island entirely — `share-view.tsx` is a
Server Component that takes the saved rows and renders them statically. The only client island
on that page is the `CopyAsMarkdownButton`.

## Error handling philosophy

- **At system boundaries** (route handlers, server actions, fetch): catch exceptions, convert to
  `Result.err`, return a structured response.
- **Inside `lib/`**: prefer `Result<T, E>` over throwing. The exception is invariant violations —
  e.g. `calculateCost` throws on an unknown model id because that's a programmer bug we want
  loud at runtime.
- **In components**: per-column error state. A failure in one provider must not blank the
  others — partial success across columns is the whole point of the app.

## RSC ↔ client boundary

- `LLMProvider` (with `getModel`) is **server-only**. Never cross the boundary with it.
- `ProviderInfo` is the serializable variant. Use `getAllProviderInfos()` from Server Components
  that need to hand provider metadata to a client island.
- The streaming protocol is text + a sentinel. No SSE, no AI SDK UI message protocol. Reasoning
  in the [streaming.ts header comment](./src/lib/streaming.ts).

## Test layout

Mirrors `src/`. Pure functions in `src/lib/` get unit-test coverage; provider implementations
mock the AI SDK packages. Route handlers and React components are intentionally not unit-tested
in the MVP — the 89 tests focus on the contracts (formats, schemas, query shapes) that matter
for refactor safety.
