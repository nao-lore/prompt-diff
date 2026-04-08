import type { ProviderId } from '@/lib/providers/types';

/**
 * Per-column UI state. Lives in the parent CompareView; each column
 * receives a slice + an updater. Kept here so the slice and the props
 * stay in sync as the schema grows.
 */
export interface ColumnState {
  readonly providerId: ProviderId;
  readonly modelId: string;
  readonly status: 'idle' | 'streaming' | 'done' | 'error';
  readonly output: string;
  readonly latencyMs: number | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly costUsd: number | null;
  readonly errorMessage: string | null;
}
