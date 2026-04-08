import { describe, expect, it } from 'vitest';
import { saveComparisonSchema } from '@/lib/validations/comparison';

const VALID = {
  prompt: 'hello',
  results: [
    {
      provider: 'anthropic' as const,
      model: 'claude-sonnet-4-6',
      output: 'hi there',
      latency_ms: 100,
      input_tokens: 5,
      output_tokens: 10,
      cost_usd: 0.0001,
    },
  ],
};

describe('saveComparisonSchema', () => {
  it('accepts a valid payload', () => {
    expect(saveComparisonSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const r = saveComparisonSchema.safeParse({ ...VALID, prompt: '' });
    expect(r.success).toBe(false);
  });

  it('rejects empty results array', () => {
    const r = saveComparisonSchema.safeParse({ ...VALID, results: [] });
    expect(r.success).toBe(false);
  });

  it('rejects unknown provider', () => {
    const r = saveComparisonSchema.safeParse({
      ...VALID,
      results: [{ ...VALID.results[0], provider: 'mistral' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects negative latency', () => {
    const r = saveComparisonSchema.safeParse({
      ...VALID,
      results: [{ ...VALID.results[0], latency_ms: -1 }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects negative cost', () => {
    const r = saveComparisonSchema.safeParse({
      ...VALID,
      results: [{ ...VALID.results[0], cost_usd: -0.01 }],
    });
    expect(r.success).toBe(false);
  });
});
