import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind class name combiner. Uses `clsx` to flatten conditional inputs
 * and `tailwind-merge` to dedupe conflicting Tailwind utilities (so a
 * caller-supplied `p-2` correctly overrides a default `p-4`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
