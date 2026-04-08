import { describe, expect, it, vi } from 'vitest';

vi.mock('@ai-sdk/anthropic', () => ({ anthropic: vi.fn(() => ({})) }));
vi.mock('@ai-sdk/openai', () => ({ openai: vi.fn(() => ({})) }));
vi.mock('@ai-sdk/google', () => ({ google: vi.fn(() => ({})) }));

import { getAllProviders, getProvider, PROVIDER_IDS } from '@/lib/providers';

describe('provider registry', () => {
  it('PROVIDER_IDS lists all three providers', () => {
    expect([...PROVIDER_IDS].sort()).toEqual(['anthropic', 'google', 'openai']);
  });

  it('getProvider returns the matching provider for each id', () => {
    expect(getProvider('anthropic').id).toBe('anthropic');
    expect(getProvider('openai').id).toBe('openai');
    expect(getProvider('google').id).toBe('google');
  });

  it('getAllProviders returns one provider per id', () => {
    const all = getAllProviders();
    expect(all).toHaveLength(3);
    const ids = all.map((p) => p.id).sort();
    expect(ids).toEqual(['anthropic', 'google', 'openai']);
  });

  it('every provider has a defaultModel inside its availableModels', () => {
    for (const p of getAllProviders()) {
      expect(p.availableModels).toContain(p.defaultModel);
    }
  });
});
