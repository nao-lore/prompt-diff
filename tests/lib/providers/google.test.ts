import { describe, expect, it, vi } from 'vitest';

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn((modelId: string) => ({ __mock: 'google-model', modelId })),
}));

import { google } from '@ai-sdk/google';
import { googleProvider } from '@/lib/providers/google';

describe('googleProvider', () => {
  it('exposes correct metadata', () => {
    expect(googleProvider.id).toBe('google');
    expect(googleProvider.displayName).toBe('Google');
    expect(googleProvider.defaultModel).toBe('gemini-2.5-pro');
    expect(googleProvider.availableModels).toContain('gemini-2.5-pro');
  });

  it('getModel calls the SDK with the requested model id', () => {
    const model = googleProvider.getModel('gemini-2.5-pro');
    expect(google).toHaveBeenCalledWith('gemini-2.5-pro');
    expect(model).toEqual({ __mock: 'google-model', modelId: 'gemini-2.5-pro' });
  });

  it('throws on unsupported model', () => {
    expect(() => googleProvider.getModel('gemini-99')).toThrow(/not supported/);
  });
});
