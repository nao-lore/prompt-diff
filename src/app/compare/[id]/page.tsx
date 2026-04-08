import { notFound } from 'next/navigation';
import { ShareView } from '@/components/compare/share-view';
import { getComparisonWithResults } from '@/lib/db/queries';

/**
 * Server Component for the share URL. Fetches the comparison and its
 * results once at request time. Anyone with the URL can read it
 * (the public-read RLS policy in 0001_initial.sql).
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Prompt Diff — Run ${id.slice(0, 8)}`,
    description: 'Compare LLM outputs side by side.',
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getComparisonWithResults(id);

  if (!result.ok) {
    // Distinguish "not found" from "DB error". The query layer encodes
    // the missing case with a "not found" message; everything else is
    // surfaced as a 500 by re-throwing into the Next.js error boundary.
    if (/not found/i.test(result.error.message)) notFound();
    throw result.error;
  }

  return <ShareView comparison={result.value.comparison} results={result.value.results} />;
}
