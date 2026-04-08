import { openai } from '@ai-sdk/openai';
import { assertModelSupported, type LLMProvider } from './types';

const ID = 'openai' as const;

const AVAILABLE_MODELS = ['gpt-5', 'gpt-5-mini', 'gpt-4o'] as const;

export const openaiProvider: LLMProvider = {
  id: ID,
  displayName: 'OpenAI',
  defaultModel: 'gpt-5',
  availableModels: AVAILABLE_MODELS,
  getModel(modelId) {
    assertModelSupported(ID, modelId, AVAILABLE_MODELS);
    return openai(modelId);
  },
};
