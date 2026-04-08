import { google } from '@ai-sdk/google';
import { assertModelSupported, type LLMProvider } from './types';

const ID = 'google' as const;

const AVAILABLE_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'] as const;

export const googleProvider: LLMProvider = {
  id: ID,
  displayName: 'Google',
  defaultModel: 'gemini-2.5-pro',
  availableModels: AVAILABLE_MODELS,
  getModel(modelId) {
    assertModelSupported(ID, modelId, AVAILABLE_MODELS);
    return google(modelId);
  },
};
