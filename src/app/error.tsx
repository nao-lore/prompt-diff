'use client';

// Per-segment error boundary. Catches uncaught errors thrown from
// Server Components, route handlers, and client components within the
// app/ tree, except the root layout (handled by global-error.tsx).

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // In production this is where Sentry / posthog / etc. would hook in.
    // For now log to the console so the digest is grep-able.
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-16">
      <p className="font-mono text-xs text-zinc-500">500</p>
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong.</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || 'An unexpected error occurred.'}
        {error.digest && (
          <>
            <br />
            <span className="font-mono text-xs">digest: {error.digest}</span>
          </>
        )}
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </main>
  );
}
