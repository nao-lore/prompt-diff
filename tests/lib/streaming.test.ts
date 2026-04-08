import { describe, expect, it } from 'vitest';
import { META_SENTINEL, parseRunResponse, serializeMetadata } from '@/lib/streaming';

const META = {
  latencyMs: 1234,
  inputTokens: 50,
  outputTokens: 100,
  costUsd: 0.0021,
};

describe('serializeMetadata', () => {
  it('round-trips through parseRunResponse', () => {
    const body = 'Hello world.' + serializeMetadata(META);
    const parsed = parseRunResponse(body);
    expect(parsed.text).toBe('Hello world.');
    expect(parsed.metadata).toEqual(META);
  });

  it('uses the META sentinel as a separator', () => {
    expect(serializeMetadata(META).startsWith(META_SENTINEL)).toBe(true);
  });
});

describe('parseRunResponse', () => {
  it('returns null metadata when sentinel is absent', () => {
    const parsed = parseRunResponse('plain text only');
    expect(parsed.text).toBe('plain text only');
    expect(parsed.metadata).toBeNull();
  });

  it('returns null metadata when JSON is malformed', () => {
    const parsed = parseRunResponse('text' + META_SENTINEL + '{not json');
    expect(parsed.text).toBe('text');
    expect(parsed.metadata).toBeNull();
  });

  it('handles an empty text body', () => {
    const parsed = parseRunResponse(serializeMetadata(META));
    expect(parsed.text).toBe('');
    expect(parsed.metadata).toEqual(META);
  });
});
