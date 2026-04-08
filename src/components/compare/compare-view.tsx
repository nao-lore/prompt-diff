'use client';

// 'use client': holds the per-column state, prompt input, and the Run
// handler that fans out three parallel /api/run requests.

import { useRef, useState } from 'react';
import { runStream } from '@/lib/run-client';
import type { ProviderId, ProviderInfo } from '@/lib/providers/types';
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

    await Promise.all(
      snapshot.map(async ({ providerId, modelId }) => {
        try {
          const meta = await runStream({
            prompt,
            provider: providerId,
            modelId,
            signal: controller.signal,
            onText: (delta) => {
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
