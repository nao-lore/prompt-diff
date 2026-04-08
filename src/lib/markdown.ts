import type { ProviderId } from '@/lib/providers/types';

/**
 * Pure formatter that turns a finished comparison into a Zenn-ready
 * Markdown block. Lives in `lib/` (not next to the button) because the
 * format is the contract: tests pin it, the button just calls this.
 */

export interface MarkdownResult {
  readonly provider: ProviderId;
  readonly model: string;
  readonly output: string;
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

export function formatComparisonAsMarkdown(
  prompt: string,
  results: readonly MarkdownResult[],
): string {
  const sections = [`## Prompt`, '', blockquote(prompt), ''];
  for (const r of results) {
    sections.push(`## ${PROVIDER_LABELS[r.provider]} — \`${r.model}\``);
    sections.push('');
    sections.push(r.output.trimEnd());
    sections.push('');
    sections.push('| Latency | Input tokens | Output tokens | Est. cost |');
    sections.push('|---|---|---|---|');
    sections.push(
      `| ${formatLatency(r.latencyMs)} | ${formatInt(r.inputTokens)} | ${formatInt(r.outputTokens)} | ${formatCost(r.costUsd)} |`,
    );
    sections.push('');
  }
  return (
    sections
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}

function blockquote(text: string): string {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

// Exported for unit tests.
export const __internal = { blockquote, formatLatency, formatInt, formatCost };
