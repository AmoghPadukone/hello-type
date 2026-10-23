import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { SegmentedProps } from './segmented.types';

/** iOS-style segmented control (single choice, never empty). */
export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={v => v && onChange(v as T)}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-inset ring-white/[0.06]"
    >
      {options.map(o => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent data-[state=on]:bg-white/[0.12] data-[state=on]:text-fg data-[state=on]:shadow-sm"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
