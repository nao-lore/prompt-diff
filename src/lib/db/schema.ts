import type { ProviderId } from '@/lib/providers/types';

/**
 * Row shapes mirroring `supabase/migrations/0001_initial.sql`.
 *
 * Kept hand-written rather than generated for two reasons:
 * 1. The schema is small and stable enough that the codegen toolchain
 *    is not worth the operational cost.
 * 2. We can constrain `provider` to the `ProviderId` union, which the
 *    Supabase generator cannot infer from a `text` column.
 */

export interface ComparisonRow {
  id: string;
  prompt: string;
  created_at: string;
}

export interface ResultRow {
  id: string;
  comparison_id: string;
  provider: ProviderId;
  model: string;
  output: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

/** Insert payload for `results` (id + created_at are server-generated). */
export type ResultInsert = Omit<ResultRow, 'id' | 'created_at'>;

/** A comparison joined with its child results, used by the share view. */
export interface ComparisonWithResults {
  comparison: ComparisonRow;
  results: ResultRow[];
}
