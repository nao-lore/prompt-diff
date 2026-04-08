import type { LanguageModel } from 'ai';

/**
 * Stable identifiers for the supported provider families.
 * Adding a new provider = add to this union + create one file under
 * `src/lib/providers/<id>.ts` + register it in `index.ts`.
 */
export type ProviderId = 'anthropic' | 'openai' | 'google';

/**
 * Common interface every LLM provider must implement.
 *
 * The interface deliberately does **not** expose streaming directly —
 * that responsibility belongs to the route handler in PR #6, which uses
 * `streamText` from the Vercel AI SDK with the `LanguageModel` returned
 * by `getModel`. Keeping providers metadata-only makes them trivially
 * testable without spinning up the SDK.
 */
export interface LLMProvider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly availableModels: readonly string[];

  /**
   * Returns a Vercel AI SDK `LanguageModel` for the given model id.
   * @throws if `modelId` is not in `availableModels`.
   */
  getModel(modelId: string): LanguageModel;
}

/**
 * Tiny helper to enforce the model whitelist consistently across providers.
 */
export function assertModelSupported(
  provider: ProviderId,
  modelId: string,
  available: readonly string[],
): void {
  if (!available.includes(modelId)) {
    throw new Error(
      `Model "${modelId}" is not supported by provider "${provider}". ` +
        `Available models: ${available.join(', ')}`,
    );
  }
}
