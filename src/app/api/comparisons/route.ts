import { createComparison, saveResults } from '@/lib/db/queries';
import { saveComparisonSchema } from '@/lib/validations/comparison';

/**
 * POST /api/comparisons
 *
 * Persist a finished comparison: one `comparisons` row + N `results` rows
 * in two queries. Returns `{ id }` so the client can navigate to
 * `/compare/[id]`.
 *
 * No transaction wrapper — Supabase doesn't expose multi-statement
 * transactions over PostgREST and the failure mode (orphan comparison
 * row with zero results) is harmless and discoverable.
 */
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Request body must be valid JSON');
  }

  const parsed = saveComparisonSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return jsonError(400, issues);
  }

  const { prompt, results } = parsed.data;

  const comparisonResult = await createComparison(prompt);
  if (!comparisonResult.ok) {
    return jsonError(500, comparisonResult.error.message);
  }
  const comparison = comparisonResult.value;

  const insertRows = results.map((r) => ({
    comparison_id: comparison.id,
    provider: r.provider,
    model: r.model,
    output: r.output,
    latency_ms: r.latency_ms,
    input_tokens: r.input_tokens,
    output_tokens: r.output_tokens,
    cost_usd: r.cost_usd,
  }));

  const saveRes = await saveResults(insertRows);
  if (!saveRes.ok) {
    return jsonError(500, saveRes.error.message);
  }

  return Response.json({ id: comparison.id }, { status: 201 });
}

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
