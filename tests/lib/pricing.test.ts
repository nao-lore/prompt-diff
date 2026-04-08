import { describe, expect, it } from 'vitest';
import { calculateCost, hasPricing, PRICING } from '@/lib/pricing';

describe('calculateCost', () => {
  it('computes cost for claude-sonnet-4-6 (input $3, output $15 per 1M)', () => {
    // 1M input + 1M output = 3 + 15 = 18
    expect(calculateCost('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBeCloseTo(18, 6);
  });

  it('scales linearly with token counts', () => {
    // 500k input + 250k output for gpt-5 ($5 in, $15 out)
    // = 0.5 * 5 + 0.25 * 15 = 2.5 + 3.75 = 6.25
    expect(calculateCost('gpt-5', 500_000, 250_000)).toBeCloseTo(6.25, 6);
  });

  it('returns 0 for zero tokens', () => {
    expect(calculateCost('gemini-2.5-pro', 0, 0)).toBe(0);
  });

  it('throws on unknown model', () => {
    expect(() => calculateCost('mystery-model', 1, 1)).toThrow(/No pricing data/);
  });

  it('throws on negative token counts', () => {
    expect(() => calculateCost('gpt-5', -1, 0)).toThrow(/non-negative/);
    expect(() => calculateCost('gpt-5', 0, -1)).toThrow(/non-negative/);
  });
});

describe('PRICING table', () => {
  it('every entry has non-negative input and output prices', () => {
    for (const [model, p] of Object.entries(PRICING)) {
      expect(p.inputPer1M, `${model}.inputPer1M`).toBeGreaterThanOrEqual(0);
      expect(p.outputPer1M, `${model}.outputPer1M`).toBeGreaterThanOrEqual(0);
    }
  });

  it('output is at least as expensive as input for every model', () => {
    // Always true in current provider pricing; if it stops being true,
    // we want a heads-up because something has changed structurally.
    for (const [model, p] of Object.entries(PRICING)) {
      expect(p.outputPer1M, `${model}: output should be >= input`).toBeGreaterThanOrEqual(
        p.inputPer1M,
      );
    }
  });
});

describe('hasPricing', () => {
  it('returns true for known models', () => {
    expect(hasPricing('claude-sonnet-4-6')).toBe(true);
  });

  it('returns false for unknown models', () => {
    expect(hasPricing('totally-fake-model')).toBe(false);
  });
});
