// Server Component: pure render of a saved comparison. No state, no
// 'use client' — the share view is intentionally read-only.

import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import type { ComparisonRow, ResultRow } from '@/lib/db/schema';
import { formatComparisonAsMarkdown } from '@/lib/markdown';
import { CopyAsMarkdownButton } from './copy-as-markdown-button';
import { MetaInfo } from './meta-info';

interface ShareViewProps {
  comparison: ComparisonRow;
  results: readonly ResultRow[];
}

export function ShareView({ comparison, results }: ShareViewProps) {
  // Format on the server so the client receives a ready-to-copy string
  // and the export button stays a tiny client island.
  const markdown = formatComparisonAsMarkdown(
    comparison.prompt,
    results.map((r) => ({
      provider: r.provider,
      model: r.model,
      output: r.output,
      latencyMs: r.latency_ms,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      costUsd: r.cost_usd,
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Prompt Diff — Shared run</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {new Date(comparison.created_at).toLocaleString()}
          </p>
        </div>
        <CopyAsMarkdownButton markdown={markdown} />
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Prompt</h2>
        <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-900">
          {comparison.prompt}
        </pre>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <Card key={r.id} className="min-w-0">
            <CardHeader>
              <span className="text-xs">
                <span className="font-semibold">{providerLabel(r.provider)}</span>
                <span className="ml-2 text-zinc-500">{r.model}</span>
              </span>
            </CardHeader>
            <CardBody className="min-h-[260px] whitespace-pre-wrap">{r.output}</CardBody>
            <CardFooter>
              <MetaInfo
                latencyMs={r.latency_ms}
                inputTokens={r.input_tokens}
                outputTokens={r.output_tokens}
                costUsd={r.cost_usd}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function providerLabel(id: ResultRow['provider']): string {
  switch (id) {
    case 'anthropic':
      return 'Anthropic';
    case 'openai':
      return 'OpenAI';
    case 'google':
      return 'Google';
  }
}
