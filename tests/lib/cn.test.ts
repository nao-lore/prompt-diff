import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('merges conflicting tailwind utilities (latter wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('preserves non-conflicting tailwind utilities', () => {
    expect(cn('p-2', 'mt-4')).toBe('p-2 mt-4');
  });
});
