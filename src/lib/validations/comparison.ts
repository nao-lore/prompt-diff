import { z } from 'zod';

/**
 * Wire schema for `POST /api/comparisons`. Mirrors `ResultInsert` minus
 * `comparison_id` (assigned by the server) and re-validates everything
 * to ensure the client can't smuggle bad numbers into the DB.
 */
export const saveResultSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google']),
  model: z.string().min(1).max(100),
  output: z.string(),
  latency_ms: z.number().int().nonnegative(),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cost_usd: z.number().nonnegative(),
});

export const saveComparisonSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  results: z.array(saveResultSchema).min(1).max(10),
});

export type SaveComparisonInput = z.infer<typeof saveComparisonSchema>;
export type SaveResultInput = z.infer<typeof saveResultSchema>;
