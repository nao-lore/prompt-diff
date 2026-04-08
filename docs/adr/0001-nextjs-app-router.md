# ADR 0001: Use the Next.js App Router

## Status

Accepted

## Context

Next.js ships two routing systems: the Pages Router (stable, well-trodden) and the App Router
(default for new projects from Next 13 onward, the only one receiving new features in Next 16).
A new project has to pick one. The decision drives data fetching, layouts, route handlers, and
the streaming model end-to-end.

This project's headline feature is "three streamed model outputs in parallel". The persistence
and share-URL pages are mostly read-once-render-once.

## Decision

Use the **App Router**.

## Consequences

**Good**

- **Server Components by default.** The share view (`/compare/[id]`) becomes a pure Server
  Component: fetch from Supabase once, render, send HTML. No client bundle for that route, no
  hydration mismatch surface, no `useEffect` to fetch.
- **Native streaming.** Route handlers can return a `Response` with a `ReadableStream` body.
  This is exactly what `/api/run` needs; the Pages Router's `res.write` API is awkward by
  comparison.
- **Route groups** (`(marketing)`) let the landing page and the app live in the same URL space
  without redirects, with separate layouts if we ever want them.
- **Cache primitives** (`fetch`, `revalidate`, etc.) are App-Router-first. Anything we do
  later with cached comparison aggregates will be easier here.

**Bad / trade-offs**

- More moving parts to teach a contributor — the RSC/client distinction is the most common
  source of confusion in modern Next.js. We mitigate this with an explicit `ProviderInfo` vs
  `LLMProvider` split (see ADR-0003) so the boundary is visible in types.
- Some third-party libraries still ship Pages-only docs. None of the libraries this project
  uses (AI SDK, Supabase JS, zod) are affected.

**Rejected alternative**

- **Pages Router**: more familiar but loses native streaming, RSC, route groups, and
  layout-level caching. Adopting it would mean re-inventing the streaming surface and giving
  up the smallest-possible-share-page win.
