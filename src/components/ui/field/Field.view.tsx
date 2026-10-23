import { InfoTip } from '../tooltip';
import type { FieldProps } from './field.types';

/** A labelled control row: label (+ optional hint) on the left, current value on the right. */
export function Field({ label, value, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-fg-muted">
          {label}
          {hint && <InfoTip>{hint}</InfoTip>}
        </span>
        {value !== undefined && <span className="font-mono text-[11px] text-fg tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}
