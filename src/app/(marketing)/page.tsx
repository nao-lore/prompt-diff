// Server Component: marketing landing. Static, no client state.

import Link from 'next/link';

export const metadata = {
  title: 'Prompt Diff — compare Claude, GPT, and Gemini side by side',
  description:
    'Send the same prompt to three LLMs at once and compare output, latency, tokens, and cost in a single 3-column view.',
};

const FEATURES = [
  {
    title: 'Three columns, one prompt',
    body: 'Run the same prompt against Claude, GPT, and Gemini in parallel. No tab-switching, no copy-pasting.',
  },
  {
    title: 'Real cost and latency',
    body: 'Each column shows latency, input/output tokens, and an estimated USD cost from the official price tables.',
  },
  {
    title: 'Share with one click',
    body: 'Every run gets a public share URL. Anyone with the link can read the comparison.',
  },
  {
    title: 'Zenn-ready Markdown export',
    body: 'Copy a finished comparison as Markdown and paste it directly into your draft.',
  },
];

export default function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Compare Claude, GPT, and Gemini side by side.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Prompt Diff sends one prompt to three frontier LLMs at once and shows the output, latency,
          token count, and estimated cost in a single 3-column view. Built for engineers who write
          model comparison articles and want to stop tab-hopping.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/compare"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Open the compare view →
          </Link>
          <a
            href="https://github.com/nao-lore/prompt-diff"
            className="text-sm text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="mb-2 text-base font-semibold">{f.title}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        Built with Next.js · TypeScript · Vercel AI SDK · Supabase. MIT licensed.
      </footer>
    </main>
  );
}
