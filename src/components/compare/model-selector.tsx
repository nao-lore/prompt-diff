'use client';

// 'use client': native <select> needs an onChange handler tied to React state.

import { cn } from '@/lib/cn';
import type { ProviderInfo } from '@/lib/providers/types';

interface ModelSelectorProps {
  provider: ProviderInfo;
  modelId: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ provider, modelId, onChange, disabled }: ModelSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="font-semibold">{provider.displayName}</span>
      <select
        aria-label={`${provider.displayName} model`}
        value={modelId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900',
          'focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none',
          'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-50',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {provider.availableModels.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  );
}
