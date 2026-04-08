import { z } from 'zod';

/**
 * Environment variable schema.
 *
 * Why split into server and client?
 * - Anything in `clientSchema` ends up in the JS bundle. Keep it minimal.
 * - `NEXT_PUBLIC_*` is the only convention Next.js exposes to the browser.
 *
 * Validation runs lazily on first access to `env`. This keeps tests
 * trivially mockable while still failing loudly the first time the app
 * touches an env var in production.
 */
const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const isServer = typeof window === 'undefined';

function parseEnv(): Env {
  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!clientResult.success) {
    throw new Error(formatZodError('Invalid client env vars', clientResult.error));
  }

  if (!isServer) {
    return { ...clientResult.data } as Env;
  }

  const serverResult = serverSchema.safeParse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!serverResult.success) {
    throw new Error(formatZodError('Invalid server env vars', serverResult.error));
  }

  return { ...serverResult.data, ...clientResult.data };
}

function formatZodError(prefix: string, error: z.ZodError): string {
  const issues = error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  return `${prefix}:\n${issues}`;
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = ServerEnv & ClientEnv;

let cached: Env | null = null;

function getEnv(): Env {
  if (cached) return cached;
  cached = parseEnv();
  return cached;
}

/**
 * Lazy proxy to env vars. First property access triggers parsing/validation.
 * Subsequent accesses are cached.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
});

export const __internal = {
  serverSchema,
  clientSchema,
  parseEnv,
  resetCache: () => {
    cached = null;
  },
};
