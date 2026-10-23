import { Check, Pipette } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LIGHT_SWATCHES, SWATCHES } from './color-picker.constants';
import type { ColorPickerProps } from './color-picker.types';

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const custom = !SWATCHES.includes(value.toLowerCase());
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
      {SWATCHES.map(c => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className="grid size-7 place-items-center rounded-full ring-1 ring-white/15 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ background: c }}
        >
          {value.toLowerCase() === c && (
            <Check className={cn('size-3.5', LIGHT_SWATCHES.includes(c) ? 'text-black' : 'text-white')} />
          )}
        </button>
      ))}
      <label
        className={cn(
          'relative grid size-7 cursor-pointer place-items-center rounded-full ring-1 ring-white/15 transition-transform hover:scale-110',
          custom ? 'ring-2 ring-accent' : 'bg-white/[0.06]',
        )}
        style={custom ? { background: value } : undefined}
        title="Custom colour"
      >
        <Pipette className="size-3.5 text-fg-muted mix-blend-difference" />
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Custom colour"
        />
      </label>
    </div>
  );
}
