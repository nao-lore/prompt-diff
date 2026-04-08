// Server Component: rendered for unmatched routes (and `notFound()`).

import Link from 'next/link';

export const metadata = {
  title: 'Not found',
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-16">
      <p className="font-mono text-xs text-zinc-500">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page does not exist.</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The comparison you&rsquo;re looking for might have been deleted, or the link might be wrong.
      </p>
      <div className="flex gap-3 text-sm">
        <Link href="/" className="underline underline-offset-4">
          ← Home
        </Link>
        <Link href="/compare" className="underline underline-offset-4">
          Open compare view
        </Link>
      </div>
    </main>
  );
}
