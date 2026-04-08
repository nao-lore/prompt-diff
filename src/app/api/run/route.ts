import { streamText } from 'ai';
import { z } from 'zod';
import { calculateCost, hasPricing } from '@/lib/pricing';
import { getProvider } from '@/lib/providers';
import { serializeMetadata, type RunMetadata } from '@/lib/streaming';

/**
 * POST /api/run
 *
 * One request = one model. The client fans out three parallel requests
 * (one per column) and consumes each stream independently. Keeping the
 * route single-model means there's no multiplexing, no SSE parser, and
 * no shared cancellation surface.
 *
 * Errors are funneled through `errorResponse` so callers always get a
 * structured JSON error rather than a generic 500.
 */

export const runtime = 'nodejs';

const requestSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google']),
  modelId: z.string().min(1),
  prompt: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Request body must be valid JSON');
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, formatZodError(parsed.error));
  }

  const { provider: providerId, modelId, prompt } = parsed.data;

  let model;
  try {
    model = getProvider(providerId).getModel(modelId);
  } catch (e) {
    return errorResponse(400, e instanceof Error ? e.message : 'Unsupported model');
  }

  if (!hasPricing(modelId)) {
    return errorResponse(500, `No pricing data for model: ${modelId}`);
  }

  const startTime = Date.now();

  let result;
  try {
    result = streamText({ model, prompt });
  } catch (e) {
    return errorResponse(500, e instanceof Error ? e.message : 'Failed to start stream');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        const usage = await result.usage;
        const inputTokens = usage.inputTokens ?? 0;
        const outputTokens = usage.outputTokens ?? 0;
        const meta: RunMetadata = {
          latencyMs: Date.now() - startTime,
          inputTokens,
          outputTokens,
          costUsd: calculateCost(modelId, inputTokens, outputTokens),
        };
        controller.enqueue(encoder.encode(serializeMetadata(meta)));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
