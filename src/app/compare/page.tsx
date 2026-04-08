// Server Component: fetches the static provider list and hands it to the
// client island. No data dependencies → can be statically rendered.

import { CompareView } from '@/components/compare/compare-view';
import { getAllProviderInfos } from '@/lib/providers';

export const metadata = {
  title: 'Prompt Diff — compare LLM outputs side by side',
  description:
    'Send the same prompt to Claude, GPT, and Gemini and compare output, latency, tokens, and cost.',
};

export default function ComparePage() {
  const providers = getAllProviderInfos();
  return <CompareView providers={providers} />;
}
