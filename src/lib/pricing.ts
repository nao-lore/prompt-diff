/**
 * Hardcoded model pricing snapshot.
 *
 * All values are USD per **1 million tokens**, taken from the providers'
 * public pricing pages. These figures are intentionally hardcoded rather
 * than fetched at runtime: prices change rarely, and the cost of a stale
 * estimate is far lower than the cost of an extra HTTP call on every run.
 *
 * Snapshot date: 2026-04 (update via PR when prices change).
 */

export interface ModelPricing {
  /** USD per 1M input tokens. */
  readonly inputPer1M: number;
  /** USD per 1M output tokens. */
  readonly outputPer1M: number;
}

export const PRICING: Readonly<Record<string, ModelPricing>> = {
  // Anthropic
  'claude-sonnet-4-6': { inputPer1M: 3, outputPer1M: 15 },
  'claude-opus-4-6': { inputPer1M: 15, outputPer1M: 75 },
  'claude-haiku-4-5': { inputPer1M: 1, outputPer1M: 5 },

  // OpenAI
  'gpt-5': { inputPer1M: 5, outputPer1M: 15 },
  'gpt-5-mini': { inputPer1M: 0.5, outputPer1M: 1.5 },
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10 },

  // Google
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 5 },
  'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  'gemini-2.0-flash': { inputPer1M: 0.1, outputPer1M: 0.4 },
};

const TOKENS_PER_PRICING_UNIT = 1_000_000;

/**
 * Compute USD cost for a single model run.
 * @throws if the model has no pricing entry — fail loudly so we can't
 *   silently ship $0 estimates for new models we forgot to register.
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model];
  if (!pricing) {
    throw new Error(`No pricing data for model: ${model}`);
  }
  if (inputTokens < 0 || outputTokens < 0) {
    throw new Error('Token counts must be non-negative');
  }
  const inputCost = (inputTokens / TOKENS_PER_PRICING_UNIT) * pricing.inputPer1M;
  const outputCost = (outputTokens / TOKENS_PER_PRICING_UNIT) * pricing.outputPer1M;
  return inputCost + outputCost;
}

export function hasPricing(model: string): boolean {
  return model in PRICING;
}
