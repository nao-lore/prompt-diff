'use client';

// Root-level error boundary. Catches errors thrown from the root layout
// itself (or anything that prevents `app/error.tsx` from rendering).
// Must include its own <html> and <body>.

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global-error.tsx]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '40rem',
          margin: '4rem auto',
          padding: '0 1.5rem',
          color: '#171717',
        }}
      >
        <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#71717a' }}>500</p>
        <h1 style={{ fontSize: '1.875rem', margin: '0.5rem 0 1rem', fontWeight: 600 }}>
          Something went wrong.
        </h1>
        <p style={{ color: '#52525b', marginBottom: '1.5rem' }}>
          {error.message || 'An unexpected error occurred.'}
          {error.digest ? ` (${error.digest})` : ''}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#18181b',
            color: '#fafafa',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
