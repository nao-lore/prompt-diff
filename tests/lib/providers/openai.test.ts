import { describe, expect, it, vi } from 'vitest';

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn((modelId: string) => ({ __mock: 'openai-model', modelId })),
}));

import { openai } from '@ai-sdk/openai';
import { openaiProvider } from '@/lib/providers/openai';

describe('openaiProvider', () => {
  it('exposes correct metadata', () => {
    expect(openaiProvider.id).toBe('openai');
    expect(openaiProvider.displayName).toBe('OpenAI');
    expect(openaiProvider.defaultModel).toBe('gpt-5');
    expect(openaiProvider.availableModels).toContain('gpt-5');
  });

  it('getModel calls the SDK with the requested model id', () => {
    const model = openaiProvider.getModel('gpt-5');
    expect(openai).toHaveBeenCalledWith('gpt-5');
    expect(model).toEqual({ __mock: 'openai-model', modelId: 'gpt-5' });
  });

  it('throws on unsupported model', () => {
    expect(() => openaiProvider.getModel('gpt-99')).toThrow(/not supported/);
  });
});
