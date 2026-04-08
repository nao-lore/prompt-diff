# ADR 0004: No authentication in the MVP

## Status

Accepted

## Context

Comparisons are persisted to Supabase and addressable at `/compare/[id]`. Two questions follow:

1. Who can read a comparison? Anyone with the URL, or only the creator?
2. Who can write a comparison? Anyone, or only signed-in users?

Adding auth to the MVP would mean: a Supabase Auth integration, sign-in / sign-up routes, an
auth middleware on `/api/run` and `/api/comparisons`, RLS policies keyed on `user_id`, and a
"my history" UI.

The MVP's primary use case is _"I am the user, I want to paste a finished comparison into a
draft article."_ The product is single-user dogfooding. There is no sharing-without-leakage
requirement, no abuse vector beyond what the API rate limits already cover, and no per-user
billing in scope.

## Decision

**No authentication in the MVP.** API keys live in environment variables on the server. Anyone
who can reach the deployed instance can run a comparison; anyone with a comparison's `id` can
read it. RLS is enabled with a `using (true)` public-read policy on both tables — writes go
through the service role on the server.

## Consequences

**Good**

- **No auth code.** Zero session middleware, zero sign-in pages, zero "did the user click the
  email link yet" debugging.
- **Share URLs are immediately useful.** Paste a `/compare/[id]` link into a Slack DM, a
  draft article, or a tweet — the recipient sees the comparison without an account.
- **Server-side API keys stay server-side.** The pattern (route handler reads the env var,
  client never sees it) is the same with or without user auth.

**Bad / trade-offs**

- **No per-user history.** A user can't see "all my past comparisons" — only the URLs they've
  saved. Acceptable for the MVP because the share-URL flow is the only history we promised.
- **Anyone with a `/compare/[id]` URL can read it.** This is by design (the share URL is the
  feature) but it means no one should paste sensitive prompts into the deployed instance.
  Documented in the README.
- **Public deployment is open to abuse.** Mitigated for now by hosting only personally and not
  sharing the URL. The first thing v1.1 does is add Supabase Auth (see roadmap in README).

**Rejected alternative**

- **Auth in the MVP**: ~3 days of work for a single-user product, blocking the actual feature
  set. The migration path to auth in v1.1 is mechanical: enable Supabase Auth, change the RLS
  policies to `auth.uid() = user_id`, add a `user_id` column to both tables with a
  backfill-or-truncate plan, gate the route handlers behind a session check.
