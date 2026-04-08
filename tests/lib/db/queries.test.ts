import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the client module so queries don't need real env vars or a network.
const mockBuilder = {
  from: vi.fn(),
};

vi.mock('@/lib/db/client', () => ({
  getSupabaseClient: () => mockBuilder,
}));

import { createComparison, getComparisonWithResults, saveResults } from '@/lib/db/queries';
import type { ComparisonRow, ResultInsert, ResultRow } from '@/lib/db/schema';

const COMPARISON: ComparisonRow = {
  id: 'cmp-1',
  prompt: 'hello',
  created_at: '2026-04-08T00:00:00Z',
};

const RESULT: ResultRow = {
  id: 'res-1',
  comparison_id: 'cmp-1',
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  output: 'hi',
  latency_ms: 123,
  input_tokens: 10,
  output_tokens: 20,
  cost_usd: 0.0003,
  created_at: '2026-04-08T00:00:01Z',
};

beforeEach(() => {
  mockBuilder.from.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createComparison', () => {
  it('rejects an empty prompt without touching the DB', async () => {
    const result = await createComparison('   ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/empty/);
    expect(mockBuilder.from).not.toHaveBeenCalled();
  });

  it('returns the inserted row on success', async () => {
    mockBuilder.from.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: COMPARISON, error: null }),
        }),
      }),
    });

    const result = await createComparison('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(COMPARISON);
  });

  it('propagates DB errors as Err', async () => {
    mockBuilder.from.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'pg fail' } }),
        }),
      }),
    });

    const result = await createComparison('hello');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('pg fail');
  });
});

describe('saveResults', () => {
  const insert: ResultInsert = {
    comparison_id: 'cmp-1',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    output: 'hi',
    latency_ms: 123,
    input_tokens: 10,
    output_tokens: 20,
    cost_usd: 0.0003,
  };

  it('rejects empty arrays', async () => {
    const result = await saveResults([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/empty/);
    expect(mockBuilder.from).not.toHaveBeenCalled();
  });

  it('returns inserted rows on success', async () => {
    mockBuilder.from.mockReturnValue({
      insert: () => ({
        select: async () => ({ data: [RESULT], error: null }),
      }),
    });

    const result = await saveResults([insert]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([RESULT]);
  });

  it('propagates DB errors as Err', async () => {
    mockBuilder.from.mockReturnValue({
      insert: () => ({
        select: async () => ({ data: null, error: { message: 'constraint violation' } }),
      }),
    });

    const result = await saveResults([insert]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('constraint violation');
  });
});

describe('getComparisonWithResults', () => {
  it('returns the comparison and its results', async () => {
    mockBuilder.from.mockImplementation((table: string) => {
      if (table === 'comparisons') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: COMPARISON, error: null }) }),
          }),
        };
      }
      // results
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [RESULT], error: null }),
          }),
        }),
      };
    });

    const result = await getComparisonWithResults('cmp-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.comparison).toEqual(COMPARISON);
      expect(result.value.results).toEqual([RESULT]);
    }
  });

  it('returns Err when comparison is missing', async () => {
    mockBuilder.from.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    });

    const result = await getComparisonWithResults('missing');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/not found/);
  });

  it('propagates results-table errors', async () => {
    mockBuilder.from.mockImplementation((table: string) => {
      if (table === 'comparisons') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: COMPARISON, error: null }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({ data: null, error: { message: 'results read fail' } }),
          }),
        }),
      };
    });

    const result = await getComparisonWithResults('cmp-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('results read fail');
  });
});
