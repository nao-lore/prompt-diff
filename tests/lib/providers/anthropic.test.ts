import { describe, expect, it, vi } from 'vitest';

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn((modelId: string) => ({ __mock: 'anthropic-model', modelId })),
}));

import { anthropic } from '@ai-sdk/anthropic';
import { anthropicProvider } from '@/lib/providers/anthropic';

describe('anthropicProvider', () => {
  it('exposes correct metadata', () => {
    expect(anthropicProvider.id).toBe('anthropic');
    expect(anthropicProvider.displayName).toBe('Anthropic');
    expect(anthropicProvider.defaultModel).toBe('claude-sonnet-4-6');
    expect(anthropicProvider.availableModels).toContain('claude-sonnet-4-6');
  });

  it('getModel calls the SDK with the requested model id', () => {
    const model = anthropicProvider.getModel('claude-sonnet-4-6');
    expect(anthropic).toHaveBeenCalledWith('claude-sonnet-4-6');
    expect(model).toEqual({ __mock: 'anthropic-model', modelId: 'claude-sonnet-4-6' });
  });

  it('throws on unsupported model', () => {
    expect(() => anthropicProvider.getModel('claude-7-ultra')).toThrow(/not supported/);
  });
});
