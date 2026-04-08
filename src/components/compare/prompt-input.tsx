'use client';

// 'use client': controlled <textarea> needs local state and an onChange handler.

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
  isRunning: boolean;
}

export function PromptInput({ value, onChange, onRun, isRunning }: PromptInputProps) {
  const canRun = !isRunning && value.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="prompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Prompt
      </label>
      <Textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask the same question to all three models…"
        rows={4}
        disabled={isRunning}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canRun) {
            e.preventDefault();
            onRun();
          }
        }}
      />
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Press ⌘/Ctrl + Enter to run</span>
        <Button onClick={onRun} disabled={!canRun}>
          {isRunning ? 'Running…' : 'Run'}
        </Button>
      </div>
    </div>
  );
}
