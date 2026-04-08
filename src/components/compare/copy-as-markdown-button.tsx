'use client';

// 'use client': calls navigator.clipboard, holds a transient "copied"
// state for the success affordance.

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CopyAsMarkdownButtonProps {
  markdown: string;
}

export function CopyAsMarkdownButton({ markdown }: CopyAsMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Browsers throw if the clipboard permission is denied. Surface
      // it inline so the user knows the click registered.
      setCopied(false);
      alert('Could not copy to clipboard');
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} disabled={markdown.length === 0}>
      {copied ? 'Copied!' : 'Copy as Markdown'}
    </Button>
  );
}
