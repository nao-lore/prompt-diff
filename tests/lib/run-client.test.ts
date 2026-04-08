import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runStream } from '@/lib/run-client';
import { serializeMetadata, type RunMetadata } from '@/lib/streaming';

const META: RunMetadata = {
  latencyMs: 100,
  inputTokens: 5,
  outputTokens: 10,
  costUsd: 0.0001,
};

function streamFromString(s: string, chunkSize = 4): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s);
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.slice(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
}

function mockResponse(body: ReadableStream<Uint8Array>, init: ResponseInit = {}): Response {
  return new Response(body, { status: 200, ...init });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runStream', () => {
  it('streams text deltas and resolves with metadata', async () => {
    const body = 'Hello, world!' + serializeMetadata(META);
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(streamFromString(body, 3)),
    );

    const chunks: string[] = [];
    const meta = await runStream({
      prompt: 'hi',
      provider: 'anthropic',
      modelId: 'claude-sonnet-4-6',
      onText: (d) => chunks.push(d),
    });

    expect(chunks.join('')).toBe('Hello, world!');
    expect(meta).toEqual(META);
  });

  it('handles a sentinel that straddles a chunk boundary', async () => {
    const body = 'abc' + serializeMetadata(META);
    // Tiny chunk size guarantees the sentinel is split.
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(streamFromString(body, 2)),
    );

    const chunks: string[] = [];
    const meta = await runStream({
      prompt: 'hi',
      provider: 'openai',
      modelId: 'gpt-5',
      onText: (d) => chunks.push(d),
    });

    expect(chunks.join('')).toBe('abc');
    expect(meta).toEqual(META);
  });

  it('throws on non-2xx with the server error message', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad model' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      runStream({
        prompt: 'hi',
        provider: 'google',
        modelId: 'gemini-2.5-pro',
        onText: () => {},
      }),
    ).rejects.toThrow('bad model');
  });

  it('throws when the server omits the metadata sentinel', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(streamFromString('only text, no meta', 5)),
    );

    await expect(
      runStream({
        prompt: 'hi',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-6',
        onText: () => {},
      }),
    ).rejects.toThrow(/sentinel/);
  });

  it('throws on malformed metadata JSON', async () => {
    const body = 'hi' + '\u0000__META__\u0000' + '{not json';
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(streamFromString(body, 4)),
    );

    await expect(
      runStream({
        prompt: 'hi',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-6',
        onText: () => {},
      }),
    ).rejects.toThrow(/malformed/);
  });
});
