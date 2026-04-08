import { describe, expect, it } from 'vitest';
import { formatComparisonAsMarkdown, __internal, type MarkdownResult } from '@/lib/markdown';

const RESULT_A: MarkdownResult = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  output: 'Hello from Claude.',
  latencyMs: 1234,
  inputTokens: 12,
  outputTokens: 24,
  costUsd: 0.000123,
};

const RESULT_B: MarkdownResult = {
  provider: 'openai',
  model: 'gpt-5',
  output: 'Hello from GPT.',
  latencyMs: 800,
  inputTokens: 12,
  outputTokens: 24,
  costUsd: 0.0123,
};

describe('formatComparisonAsMarkdown', () => {
  it('renders prompt as a blockquote', () => {
    const md = formatComparisonAsMarkdown('Say hi', [RESULT_A]);
    expect(md).toMatch(/^## Prompt\n\n> Say hi/);
  });

  it('handles a multiline prompt as multiple blockquote lines', () => {
    const md = formatComparisonAsMarkdown('line one\nline two', [RESULT_A]);
    expect(md).toContain('> line one\n> line two');
  });

  it('renders a section per result with provider label and model', () => {
    const md = formatComparisonAsMarkdown('p', [RESULT_A, RESULT_B]);
    expect(md).toContain('## Anthropic — `claude-sonnet-4-6`');
    expect(md).toContain('## OpenAI — `gpt-5`');
  });

  it('renders the meta table with formatted values', () => {
    const md = formatComparisonAsMarkdown('p', [RESULT_A]);
    expect(md).toContain('| Latency | Input tokens | Output tokens | Est. cost |');
    expect(md).toContain('| 1.23 s | 12 | 24 | $0.000123 |');
  });

  it('uses 4-decimal cost above 1 cent', () => {
    const md = formatComparisonAsMarkdown('p', [RESULT_B]);
    expect(md).toContain('| 800 ms | 12 | 24 | $0.0123 |');
  });

  it('ends with a single trailing newline', () => {
    const md = formatComparisonAsMarkdown('p', [RESULT_A]);
    expect(md.endsWith('\n')).toBe(true);
    expect(md.endsWith('\n\n')).toBe(false);
  });
});

describe('markdown formatters', () => {
  const { blockquote, formatLatency, formatInt, formatCost } = __internal;

  it('blockquote prefixes every line with > ', () => {
    expect(blockquote('a\nb')).toBe('> a\n> b');
  });

  it('formatLatency switches to seconds at 1000ms', () => {
    expect(formatLatency(999)).toBe('999 ms');
    expect(formatLatency(1000)).toBe('1.00 s');
  });

  it('formatInt uses thousands separators', () => {
    expect(formatInt(1234567)).toBe('1,234,567');
  });

  it('formatCost adapts precision around 1 cent', () => {
    expect(formatCost(0.000001)).toBe('$0.000001');
    expect(formatCost(0.5)).toBe('$0.5000');
  });
});
