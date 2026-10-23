import { InfoTip } from '../tooltip';
import type { SwitchProps } from './switch.types';

/** An on/off row for optional add-ons, as opposed to Segmented which picks between equals. */
export function Switch({ label, hint, description, checked, onChange }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          {label}
          {hint && <InfoTip>{hint}</InfoTip>}
        </span>
        {description && <span className="mt-0.5 block text-[11px] text-fg-subtle">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full ring-1 ring-white/[0.07] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
          checked ? 'bg-accent' : 'bg-white/[0.08]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  );
}
