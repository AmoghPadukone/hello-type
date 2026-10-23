import { DOT_STYLES } from '@/core/print/dots/dots.constants';
import { cn } from '@/utils/cn';
import { DotIcon } from './DotIcon.view';
import type { DotPickerProps } from './dot-picker.types';

/** Visual picker for how i/j dots print. */
export function DotPicker({ value, onChange }: DotPickerProps) {
  const selected = DOT_STYLES.find(s => s.id === value)!;
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Dot style" className="grid grid-cols-5 gap-1.5">
        {DOT_STYLES.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === value}
            title={s.description}
            onClick={() => onChange(s.id)}
            className={cn(
              'relative flex flex-col items-center gap-0.5 rounded-xl px-1 pt-1.5 pb-1.5 text-fg-muted ring-1 ring-inset transition',
              'hover:bg-white/[0.05] hover:text-fg focus-visible:outline-2 focus-visible:outline-accent',
              s.id === value ? 'bg-accent/[0.12] text-fg ring-accent/50' : 'bg-black/30 ring-white/[0.06]',
            )}
          >
            <DotIcon style={s.id} />
            <span className="text-[10px] leading-tight font-medium">{s.label}</span>
            {!s.connected && (
              <span
                className="absolute top-1 right-1 size-1.5 rounded-full bg-warning"
                aria-label="Prints separately"
              />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-fg-subtle">
        <span className="font-medium text-fg-muted">{selected.label}:</span> {selected.description}
      </p>
    </div>
  );
}
