-- Prompt Diff: initial schema
-- See CLAUDE.md "データモデル" for the design rationale.

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  provider text not null,        -- 'anthropic' | 'openai' | 'google'
  model text not null,
  output text not null,
  latency_ms integer not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists results_comparison_id_idx on results(comparison_id);

-- Public read by id (anyone with the share URL can view a comparison).
-- Writes go through the service role only (server-side).
alter table comparisons enable row level security;
alter table results enable row level security;

drop policy if exists "public read comparisons" on comparisons;
create policy "public read comparisons"
  on comparisons for select
  using (true);

drop policy if exists "public read results" on results;
create policy "public read results"
  on results for select
  using (true);
