import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Server-only Supabase client built from the service role key.
 *
 * Why a single server client?
 * - The MVP has no end-user authentication. The route handler is the
 *   only writer; share-view reads also go through the server (RSC).
 * - Lazy singleton: validating env vars eagerly at module load would
 *   trip every test that imports anything from `lib/db`. Lazy keeps
 *   the surface clean and still fails on the very first DB call.
 *
 * If a public/anon client is ever needed (e.g. realtime subscriptions),
 * add a separate factory rather than overloading this one.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Test-only: reset the cached client. */
export function __resetSupabaseClient(): void {
  cached = null;
}
