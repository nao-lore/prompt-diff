'use client';

// 'use client': holds the per-column state, prompt input, and the Run
// handler that fans out three parallel /api/run requests.

import { useRef, useState } from 'react';
import { formatComparisonAsMarkdown, type MarkdownResult } from '@/lib/markdown';
import { runStream } from '@/lib/run-client';
import type { ProviderId, ProviderInfo } from '@/lib/providers/types';
import { CopyAsMarkdownButton } from './copy-as-markdown-button';
import { PromptInput } from './prompt-input';
import { ResultColumn } from './result-column';
import type { ColumnState } from './types';

interface CompareViewProps {
  providers: readonly ProviderInfo[];
}

function initialColumns(providers: readonly ProviderInfo[]): readonly ColumnState[] {
  return providers.map((p) => ({
    providerId: p.id,
    modelId: p.defaultModel,
    status: 'idle',
    output: '',
    latencyMs: null,
    inputTokens: null,
    outputTokens: null,
    costUsd: null,
    errorMessage: null,
  }));
}

export function CompareView({ providers }: CompareViewProps) {
  const [prompt, setPrompt] = useState('');
  const [columns, setColumns] = useState<readonly ColumnState[]>(() => initialColumns(providers));
  const [isRunning, setIsRunning] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  // Snapshot of the last finished run, used to build the Markdown export.
  // Lives in state (not a ref) so the export button re-renders with content.
  const [lastRun, setLastRun] = useState<{
    prompt: string;
    results: readonly MarkdownResult[];
  } | null>(null);
  // Track in-flight aborts so a new Run can cancel the previous fan-out cleanly.
  const abortRef = useRef<AbortController | null>(null);

  function updateColumn(providerId: ProviderId, patch: Partial<ColumnState>) {
    setColumns((prev) => prev.map((c) => (c.providerId === providerId ? { ...c, ...patch } : c)));
  }

  async function run() {
    if (prompt.trim().length === 0 || isRunning) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setShareId(null);
    setLastRun(null);
    setIsRunning(true);
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'streaming',
        output: '',
        latencyMs: null,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        errorMessage: null,
      })),
    );

    // Snapshot the current model selection so a re-render mid-flight
    // can't accidentally swap models on us.
    const snapshot = columns.map((c) => ({ providerId: c.providerId, modelId: c.modelId }));

    type FinishedRun = {
      providerId: ProviderId;
      modelId: string;
      output: string;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };

    const finished: FinishedRun[] = [];

    await Promise.all(
      snapshot.map(async ({ providerId, modelId }) => {
        let accumulated = '';
        try {
          const meta = await runStream({
            prompt,
            provider: providerId,
            modelId,
            signal: controller.signal,
            onText: (delta) => {
              accumulated += delta;
              setColumns((prev) =>
                prev.map((c) =>
                  c.providerId === providerId ? { ...c, output: c.output + delta } : c,
                ),
              );
            },
          });
          updateColumn(providerId, {
            status: 'done',
            latencyMs: meta.latencyMs,
            inputTokens: meta.inputTokens,
            outputTokens: meta.outputTokens,
            costUsd: meta.costUsd,
          });
          finished.push({
            providerId,
            modelId,
            output: accumulated,
            latencyMs: meta.latencyMs,
            inputTokens: meta.inputTokens,
            outputTokens: meta.outputTokens,
            costUsd: meta.costUsd,
          });
        } catch (e) {
          if (controller.signal.aborted) return;
          updateColumn(providerId, {
            status: 'error',
            errorMessage: e instanceof Error ? e.message : String(e),
          });
        }
      }),
    );

    setIsRunning(false);

    if (!controller.signal.aborted && finished.length > 0) {
      setLastRun({
        prompt,
        results: finished.map((f) => ({
          provider: f.providerId,
          model: f.modelId,
          output: f.output,
          latencyMs: f.latencyMs,
          inputTokens: f.inputTokens,
          outputTokens: f.outputTokens,
          costUsd: f.costUsd,
        })),
      });
    }

    // Persist + surface the share URL only when at least one column succeeded
    // and the user didn't abort. Failures here are non-fatal — surface them
    // inline rather than blocking the visible run.
    if (!controller.signal.aborted && finished.length > 0) {
      try {
        const res = await fetch('/api/comparisons', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            prompt,
            results: finished.map((f) => ({
              provider: f.providerId,
              model: f.modelId,
              output: f.output,
              latency_ms: f.latencyMs,
              input_tokens: f.inputTokens,
              output_tokens: f.outputTokens,
              cost_usd: f.costUsd,
            })),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { id: string };
          setShareId(data.id);
        }
      } catch {
        // Persistence is best-effort. The run is still visible on screen.
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Prompt Diff</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Run the same prompt against three models side by side.
        </p>
      </header>

      <PromptInput value={prompt} onChange={setPrompt} onRun={run} isRunning={isRunning} />

      {(shareId || lastRun) && (
        <div className="flex flex-wrap items-center gap-3">
          {shareId && <ShareLink id={shareId} />}
          {lastRun && (
            <CopyAsMarkdownButton
              markdown={formatComparisonAsMarkdown(lastRun.prompt, lastRun.results)}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const state = columns.find((c) => c.providerId === provider.id);
          if (!state) return null;
          return (
            <ResultColumn
              key={provider.id}
              provider={provider}
              state={state}
              disabled={isRunning}
              onModelChange={(modelId) => updateColumn(provider.id, { modelId })}
            />
          );
        })}
      </div>
    </div>
  );
}

function ShareLink({ id }: { id: string }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/compare/${id}` : '';
  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
      <span className="font-medium">Share:</span>
      <a href={`/compare/${id}`} className="font-mono underline underline-offset-2">
        {url || `/compare/${id}`}
      </a>
    </div>
  );
}
