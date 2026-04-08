import { err, ok, type Result } from '@/lib/result';
import { getSupabaseClient } from './client';
import type { ComparisonRow, ComparisonWithResults, ResultInsert, ResultRow } from './schema';

/**
 * Insert a new comparison row and return the created row.
 *
 * Errors are returned as `Result.err` rather than thrown so that the
 * caller (route handler) can decide between an HTTP 4xx/5xx response.
 */
export async function createComparison(prompt: string): Promise<Result<ComparisonRow, Error>> {
  if (prompt.trim().length === 0) {
    return err(new Error('prompt must not be empty'));
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('comparisons')
    .insert({ prompt })
    .select()
    .single<ComparisonRow>();

  if (error) return err(new Error(error.message));
  if (!data) return err(new Error('createComparison: no row returned'));
  return ok(data);
}

/**
 * Bulk insert results for a comparison. Empty input is treated as an
 * error rather than a no-op so we can't accidentally save an empty run.
 */
export async function saveResults(rows: ResultInsert[]): Promise<Result<ResultRow[], Error>> {
  if (rows.length === 0) {
    return err(new Error('saveResults: rows must not be empty'));
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from('results').insert(rows).select();

  if (error) return err(new Error(error.message));
  return ok((data ?? []) as ResultRow[]);
}

/**
 * Fetch a comparison and all of its results in two queries (intentionally
 * not a join — the share view never deals with more than ~3 result rows
 * and the explicit shape is easier to reason about than `select *, results(*)`).
 */
export async function getComparisonWithResults(
  id: string,
): Promise<Result<ComparisonWithResults, Error>> {
  const client = getSupabaseClient();

  const comparisonRes = await client
    .from('comparisons')
    .select()
    .eq('id', id)
    .maybeSingle<ComparisonRow>();

  if (comparisonRes.error) return err(new Error(comparisonRes.error.message));
  if (!comparisonRes.data) return err(new Error(`comparison not found: ${id}`));

  const resultsRes = await client
    .from('results')
    .select()
    .eq('comparison_id', id)
    .order('provider', { ascending: true });

  if (resultsRes.error) return err(new Error(resultsRes.error.message));

  return ok({
    comparison: comparisonRes.data,
    results: (resultsRes.data ?? []) as ResultRow[],
  });
}
