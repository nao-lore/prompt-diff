'use client';

// 'use client': holds the per-column state, prompt input, and the (mock,
// for now) Run handler. Real streaming is wired up in PR #6.

import { useState } from 'react';
import type { ProviderId, ProviderInfo } from '@/lib/providers/types';
import { PromptInput } from './prompt-input';
import { ResultColumn } from './result-column';
import type { ColumnState } from './types';

interface CompareViewProps {
  providers: readonly ProviderInfo[];
}

const MOCK_OUTPUT: Record<ProviderId, string> = {
  anthropic: 'Mock Claude output. Real streaming is wired up in PR #6.',
  openai: 'Mock GPT output. Real streaming is wired up in PR #6.',
  google: 'Mock Gemini output. Real streaming is wired up in PR #6.',
};

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

  function updateColumn(providerId: ProviderId, patch: Partial<ColumnState>) {
    setColumns((prev) => prev.map((c) => (c.providerId === providerId ? { ...c, ...patch } : c)));
  }

  // PR #6 will replace this with real streaming via /api/run.
  function runMock() {
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

    const start = Date.now();
    setTimeout(() => {
      setColumns((prev) =>
        prev.map((c) => ({
          ...c,
          status: 'done',
          output: MOCK_OUTPUT[c.providerId],
          latencyMs: Date.now() - start,
          inputTokens: 12,
          outputTokens: 24,
          costUsd: 0.000123,
        })),
      );
      setIsRunning(false);
    }, 600);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Prompt Diff</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Run the same prompt against three models side by side.
        </p>
      </header>

      <PromptInput value={prompt} onChange={setPrompt} onRun={runMock} isRunning={isRunning} />

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
