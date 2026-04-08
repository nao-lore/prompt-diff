// Server Component: pure formatting, no interactivity.

interface MetaInfoProps {
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
}

const PLACEHOLDER = '—';

function formatLatency(ms: number | null): string {
  if (ms === null) return PLACEHOLDER;
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatTokens(n: number | null): string {
  if (n === null) return PLACEHOLDER;
  return n.toLocaleString('en-US');
}

function formatCost(usd: number | null): string {
  if (usd === null) return PLACEHOLDER;
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

export function MetaInfo({ latencyMs, inputTokens, outputTokens, costUsd }: MetaInfoProps) {
  return (
    <dl className="grid grid-cols-4 gap-2 text-[11px] tabular-nums">
      <Stat label="Latency" value={formatLatency(latencyMs)} />
      <Stat label="In tok" value={formatTokens(inputTokens)} />
      <Stat label="Out tok" value={formatTokens(outputTokens)} />
      <Stat label="Cost" value={formatCost(costUsd)} />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

// Exported for unit tests.
export const __formatters = { formatLatency, formatTokens, formatCost };
