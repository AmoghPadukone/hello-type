import { PenLine, TriangleAlert } from 'lucide-react';
import { LIMITS } from '@/settings';
import type { TextBarViewProps } from './text-bar.types';

export function TextBarView({ value, skipped, placeholder, onChange }: TextBarViewProps) {
  return (
    <div className="space-y-2.5">
      <label className="group flex h-16 items-center gap-3 rounded-2xl bg-surface px-5 ring-1 ring-white/[0.08] transition focus-within:ring-2 focus-within:ring-accent">
        <PenLine className="size-5 shrink-0 text-fg-subtle group-focus-within:text-accent" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={LIMITS.textLength}
          placeholder={placeholder}
          aria-label="Text to write"
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-xl font-medium tracking-tight text-fg outline-none placeholder:text-fg-subtle sm:text-2xl"
        />
        <span className="font-mono text-[11px] text-fg-subtle tabular-nums">
          {value.length}/{LIMITS.textLength}
        </span>
      </label>
      {skipped.length > 0 && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-warning">
          <TriangleAlert className="size-3.5" />
          Skipped {skipped.map(c => `“${c}”`).join(' ')} — lowercase a–z and spaces are supported.
        </p>
      )}
    </div>
  );
}
