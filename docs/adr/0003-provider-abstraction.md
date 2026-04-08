# ADR 0003: Provider abstraction shape

## Status

Accepted

## Context

The product rule from CLAUDE.md is _"adding a new model = one file change"_. There are several
ways to express that in TypeScript, with different costs in indirection and ceremony:

1. **Class hierarchy**: `abstract class LLMProvider`, three subclasses, `instanceof` checks.
2. **Stream method on the interface**: `LLMProvider.stream(prompt): AsyncIterable<string>`,
   each provider implements its own streaming.
3. **Metadata-only interface + factory function**: `LLMProvider` exposes only metadata and
   `getModel(modelId): LanguageModel`. Streaming lives in the route handler.
4. **No abstraction**: switch statement in the route handler.

The MVP also has a Server-Component → Client-Component data flow: the compare page is rendered
on the server but the columns are interactive. Whatever the abstraction is, it has to survive
the RSC/client boundary cleanly.

## Decision

Take **option 3**, with an explicit serializable variant for the RSC boundary:

```ts
// Server-only — has a function field, never crosses to a client component.
interface LLMProvider extends ProviderInfo {
  getModel(modelId: string): LanguageModel;
}

// Serializable — safe to pass from a Server Component to a client island.
interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  defaultModel: string;
  availableModels: readonly string[];
}

function toProviderInfo(provider: LLMProvider): ProviderInfo;
```

The registry in `src/lib/providers/index.ts` exports both `getProvider(id)` (server-side, full
`LLMProvider`) and `getAllProviderInfos()` (serializable, for client islands).

## Consequences

**Good**

- **Adding a new provider really is one new file** plus one line in the registry.
- **Trivially testable.** Mocking the AI SDK package with `vi.mock` and verifying
  `getModel(...)` was called with the right id covers each provider in 3 tests.
- **No accidental RSC boundary crashes.** The split is enforced in types — passing an
  `LLMProvider` to a client component is a compile error, and `toProviderInfo` is the only
  conversion path.
- **Streaming logic stays in one place** (the `/api/run` route handler), which keeps each
  provider file ~20 lines of metadata + a single `assertModelSupported` call.

**Bad / trade-offs**

- **Two types instead of one.** Slightly more conceptual surface for new contributors.
  Mitigated by the explicit type names and the inline comment in `types.ts`.
- **`getModel` is on `LLMProvider` not `ProviderInfo`.** This means a client component that
  wants to display "available models" gets the list, but a client component that wants to
  call the model can't — it has to go through the route handler. This is the right boundary
  (API keys must stay server-side) but it does mean the abstraction isn't symmetrical.

**Rejected alternatives**

- **Class hierarchy**: more ceremony, no win. We'd still need `toProviderInfo` for the RSC
  boundary because class instances can't cross it either.
- **Stream method on the interface**: each provider would re-implement what the AI SDK already
  does. Direct violation of "やり過ぎ禁止".
- **No abstraction**: a switch statement in the route handler is fine for 3 providers and bad
  for 4. The seam exists so the bad path never gets created.
