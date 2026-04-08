/**
 * Wire format for the /api/run endpoint.
 *
 * The route handler streams the model's text deltas as plain text chunks.
 * After the model finishes, the server appends a single sentinel followed
 * by a JSON metadata blob (latency, token usage, cost). The client splits
 * incoming bytes on the sentinel: bytes before are appended to the visible
 * output; bytes after are parsed as the final metadata.
 *
 * Why this shape rather than SSE or the AI SDK's UI message protocol?
 * - SSE adds framing overhead and event names we don't need (one stream
 *   = one model = one channel).
 * - The UI message protocol assumes a useChat-style consumer; we're
 *   rolling our own three-column UI.
 * - A NUL-prefixed sentinel cannot collide with a model's text output
 *   because the response is decoded as UTF-8 text and the model's text
 *   never contains a literal NUL.
 */

export const META_SENTINEL = '\u0000__META__\u0000';

export interface RunMetadata {
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
}

/**
 * Parse a complete server response body into the visible text and the
 * trailing metadata. Used by tests and as a reference for the streaming
 * client (which performs the same split incrementally).
 */
export function parseRunResponse(body: string): { text: string; metadata: RunMetadata | null } {
  const idx = body.indexOf(META_SENTINEL);
  if (idx === -1) return { text: body, metadata: null };
  const text = body.slice(0, idx);
  const metaJson = body.slice(idx + META_SENTINEL.length);
  try {
    const metadata = JSON.parse(metaJson) as RunMetadata;
    return { text, metadata };
  } catch {
    return { text, metadata: null };
  }
}

/**
 * Server-side helper: serialize a metadata blob to its sentinel-prefixed
 * wire form, ready to be enqueued at the end of a stream.
 */
export function serializeMetadata(meta: RunMetadata): string {
  return META_SENTINEL + JSON.stringify(meta);
}
