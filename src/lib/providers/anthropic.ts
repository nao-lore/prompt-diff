import { anthropic } from '@ai-sdk/anthropic';
import { assertModelSupported, type LLMProvider } from './types';

const ID = 'anthropic' as const;

const AVAILABLE_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'] as const;

export const anthropicProvider: LLMProvider = {
  id: ID,
  displayName: 'Anthropic',
  defaultModel: 'claude-sonnet-4-6',
  availableModels: AVAILABLE_MODELS,
  getModel(modelId) {
    assertModelSupported(ID, modelId, AVAILABLE_MODELS);
    return anthropic(modelId);
  },
};
