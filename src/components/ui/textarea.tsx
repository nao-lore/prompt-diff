import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 ' +
          'text-sm text-zinc-900 placeholder:text-zinc-500' +
          'focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none' +
          'disabled:cursor-not-allowed disabled:opacity-50' +
          'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
