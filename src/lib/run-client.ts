import type { ProviderId } from '@/lib/providers/types';
import { META_SENTINEL, type RunMetadata } from '@/lib/streaming';

/**
 * Client-side consumer of /api/run.
 *
 * Streams text deltas through `onText` and resolves with the final
 * metadata once the server emits the META sentinel. Errors (network,
 * non-2xx, malformed metadata) reject the returned promise — callers
 * are expected to wrap this with their own error UI.
 */

export interface RunOptions {
  prompt: string;
  provider: ProviderId;
  modelId: string;
  signal?: AbortSignal;
  onText: (delta: string) => void;
}

export async function runStream(options: RunOptions): Promise<RunMetadata> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      provider: options.provider,
      modelId: options.modelId,
      prompt: options.prompt,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const errBody = await safeJson(res);
    throw new Error(errBody?.error ?? `Request failed with status ${res.status}`);
  }
  if (!res.body) {
    throw new Error('Response has no body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  // While the sentinel hasn't been seen, accumulate text into `buffer`
  // (so a sentinel split across chunk boundaries can still be detected).
  // Once the sentinel arrives we switch modes and append directly to
  // `metadataJson` — never decoding the same chunk twice.
  let buffer = '';
  let metadataJson: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    if (metadataJson === null) {
      buffer += chunk;
      const sentinelIdx = buffer.indexOf(META_SENTINEL);
      if (sentinelIdx === -1) {
        // Emit everything up to the longest possible partial-sentinel suffix.
        const safeLen = buffer.length - (META_SENTINEL.length - 1);
        if (safeLen > 0) {
          options.onText(buffer.slice(0, safeLen));
          buffer = buffer.slice(safeLen);
        }
      } else {
        if (sentinelIdx > 0) options.onText(buffer.slice(0, sentinelIdx));
        metadataJson = buffer.slice(sentinelIdx + META_SENTINEL.length);
        buffer = '';
      }
    } else {
      metadataJson += chunk;
    }
  }

  // Decoder flush (handles any incomplete UTF-8 sequence still buffered).
  const tail = decoder.decode();
  if (metadataJson === null) {
    buffer += tail;
    const sentinelIdx = buffer.indexOf(META_SENTINEL);
    if (sentinelIdx === -1) {
      if (buffer.length > 0) options.onText(buffer);
      throw new Error('Server did not send metadata sentinel');
    }
    if (sentinelIdx > 0) options.onText(buffer.slice(0, sentinelIdx));
    metadataJson = buffer.slice(sentinelIdx + META_SENTINEL.length);
  } else {
    metadataJson += tail;
  }

  try {
    return JSON.parse(metadataJson) as RunMetadata;
  } catch {
    throw new Error('Server sent malformed metadata');
  }
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
