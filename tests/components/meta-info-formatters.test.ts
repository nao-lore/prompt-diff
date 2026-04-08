import { describe, expect, it } from 'vitest';
import { __formatters } from '@/components/compare/meta-info';

const { formatLatency, formatTokens, formatCost } = __formatters;

describe('formatLatency', () => {
  it('returns placeholder for null', () => {
    expect(formatLatency(null)).toBe('—');
  });
  it('uses ms below 1000', () => {
    expect(formatLatency(500)).toBe('500 ms');
    expect(formatLatency(999)).toBe('999 ms');
  });
  it('uses seconds at 1000+', () => {
    expect(formatLatency(1000)).toBe('1.00 s');
    expect(formatLatency(1234)).toBe('1.23 s');
  });
});

describe('formatTokens', () => {
  it('returns placeholder for null', () => {
    expect(formatTokens(null)).toBe('—');
  });
  it('formats with thousands separators', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(1234)).toBe('1,234');
    expect(formatTokens(1_000_000)).toBe('1,000,000');
  });
});

describe('formatCost', () => {
  it('returns placeholder for null', () => {
    expect(formatCost(null)).toBe('—');
  });
  it('uses 6 decimals for sub-cent values', () => {
    expect(formatCost(0.000123)).toBe('$0.000123');
  });
  it('uses 4 decimals at or above 1¢', () => {
    expect(formatCost(0.01)).toBe('$0.0100');
    expect(formatCost(1.5)).toBe('$1.5000');
  });
});
