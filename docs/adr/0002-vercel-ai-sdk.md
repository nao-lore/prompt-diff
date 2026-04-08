# ADR 0002: Use the Vercel AI SDK instead of per-vendor SDKs

## Status

Accepted

## Context

Each LLM vendor ships its own JavaScript SDK with its own conventions:

- `@anthropic-ai/sdk` — `messages.stream(...)`, custom event types.
- `openai` — `chat.completions.create({ stream: true })`, async iterables.
- `@google/generative-ai` — `generateContentStream`, generator functions.

This project needs to call all three with the same shape and surface a single streaming
interface to a route handler. Three options:

1. **Each vendor SDK directly**, with hand-written adapters per provider.
2. **Vercel AI SDK** (`ai` + `@ai-sdk/{anthropic,openai,google}`).
3. A custom HTTP layer hitting each vendor's REST endpoints by hand.

## Decision

Use the **Vercel AI SDK** (option 2). Each provider package exports a small function
(`anthropic('claude-sonnet-4-6')`, `openai('gpt-5')`, etc.) that returns a `LanguageModel`. The
core `streamText({ model, prompt })` call is identical regardless of which provider produced
the `LanguageModel`.

## Consequences

**Good**

- **One streaming API.** `streamText(...).textStream` is an async iterable across all three
  vendors. The route handler is ~30 lines and cleanly separated from any vendor-specific
  code.
- **Usage data is uniform.** Token counts come back via `result.usage` regardless of provider,
  so the cost calculation is provider-agnostic.
- **`LanguageModel` is the only type that crosses the abstraction.** Provider implementations
  in `src/lib/providers/` do nothing but return one. This makes "add a new provider" exactly
  one new file per the ADR-0003 spec.
- **First-party support on Vercel.** AI Gateway, observability, and provider failover all
  layer on top without changing call sites.

**Bad / trade-offs**

- **One more dependency** between us and the vendor APIs. If the AI SDK lags behind a new
  vendor feature (rare in practice), we're blocked until they ship support.
- **Slightly less control over per-vendor knobs.** Anthropic-specific cache headers, OpenAI
  tool format quirks, etc. are accessible but require dropping into provider-specific options.
  Out of scope for the MVP.

**Rejected alternatives**

- **Per-vendor SDKs**: would force three different streaming consumers in the route handler
  and a hand-written `LanguageModel`-equivalent abstraction. Pure rework for no upside.
- **Raw HTTP**: same downsides as per-vendor SDKs plus we'd own the streaming parser per
  provider. Not happening.
