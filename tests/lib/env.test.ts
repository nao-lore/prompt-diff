import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const VALID_ENV = {
  ANTHROPIC_API_KEY: 'sk-ant-test',
  OPENAI_API_KEY: 'sk-openai-test',
  GOOGLE_GENERATIVE_AI_API_KEY: 'goog-test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
} as const;

describe('env', () => {
  const original = { ...process.env };

  beforeEach(() => {
    for (const key of Object.keys(VALID_ENV)) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('parses a fully valid env', async () => {
    Object.assign(process.env, VALID_ENV);
    const { __internal } = await import('@/lib/env');
    const parsed = __internal.parseEnv();
    expect(parsed.ANTHROPIC_API_KEY).toBe('sk-ant-test');
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
  });

  it('throws when a required server key is missing', async () => {
    Object.assign(process.env, { ...VALID_ENV, ANTHROPIC_API_KEY: undefined });
    delete process.env.ANTHROPIC_API_KEY;
    const { __internal } = await import('@/lib/env');
    expect(() => __internal.parseEnv()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a URL', async () => {
    Object.assign(process.env, { ...VALID_ENV, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });
    const { __internal } = await import('@/lib/env');
    expect(() => __internal.parseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('throws when SUPABASE_SERVICE_ROLE_KEY is empty', async () => {
    Object.assign(process.env, { ...VALID_ENV, SUPABASE_SERVICE_ROLE_KEY: '' });
    const { __internal } = await import('@/lib/env');
    expect(() => __internal.parseEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
