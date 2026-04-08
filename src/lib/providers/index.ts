import { anthropicProvider } from './anthropic';
import { googleProvider } from './google';
import { openaiProvider } from './openai';
import type { LLMProvider, ProviderId } from './types';

/**
 * Registry of all supported providers, keyed by id.
 * Keep this in alphabetical order for stable iteration.
 */
const PROVIDERS = {
  anthropic: anthropicProvider,
  google: googleProvider,
  openai: openaiProvider,
} as const satisfies Record<ProviderId, LLMProvider>;

export function getProvider(id: ProviderId): LLMProvider {
  return PROVIDERS[id];
}

export function getAllProviders(): readonly LLMProvider[] {
  return Object.values(PROVIDERS);
}

export const PROVIDER_IDS = Object.keys(PROVIDERS) as readonly ProviderId[];

export type { LLMProvider, ProviderId } from './types';
