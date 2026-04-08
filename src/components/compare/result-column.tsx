'use client';

// 'use client': owns the model dropdown change handler. The output area
// itself is read-only and could be a Server Component, but co-locating
// here keeps the per-column rendering in one file.

import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { ProviderInfo } from '@/lib/providers/types';
import { MetaInfo } from './meta-info';
import { ModelSelector } from './model-selector';
import type { ColumnState } from './types';

interface ResultColumnProps {
  provider: ProviderInfo;
  state: ColumnState;
  onModelChange: (modelId: string) => void;
  disabled: boolean;
}

export function ResultColumn({ provider, state, onModelChange, disabled }: ResultColumnProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <ModelSelector
          provider={provider}
          modelId={state.modelId}
          onChange={onModelChange}
          disabled={disabled}
        />
        <StatusBadge status={state.status} />
      </CardHeader>
      <CardBody className="min-h-[260px] whitespace-pre-wrap">
        {state.status === 'error' ? (
          <p className="text-red-600 dark:text-red-400">{state.errorMessage ?? 'Unknown error'}</p>
        ) : state.output.length > 0 ? (
          state.output
        ) : (
          <p className="text-zinc-400 dark:text-zinc-600">Output will appear here.</p>
        )}
      </CardBody>
      <CardFooter>
        <MetaInfo
          latencyMs={state.latencyMs}
          inputTokens={state.inputTokens}
          outputTokens={state.outputTokens}
          costUsd={state.costUsd}
        />
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: ColumnState['status'] }) {
  const label =
    status === 'idle'
      ? 'idle'
      : status === 'streaming'
        ? 'streaming…'
        : status === 'done'
          ? 'done'
          : 'error';

  const tone = {
    idle: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400',
    streaming: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  }[status];

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium uppercase', tone)}>
      {label}
    </span>
  );
}
