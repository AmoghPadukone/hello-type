import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import type { InfoTipProps, TooltipProps } from './tooltip.types';

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className="z-50 max-w-64 rounded-lg bg-neutral-800 px-3 py-2 text-xs leading-relaxed text-fg shadow-xl ring-1 ring-white/10"
        >
          {content}
          <RadixTooltip.Arrow className="fill-neutral-800" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/** An (i) button that shows `children` as a tooltip. */
export function InfoTip({ children }: InfoTipProps) {
  return (
    <Tooltip content={children}>
      <button type="button" aria-label="More info" className="text-fg-subtle hover:text-fg-muted">
        <Info className="size-3.5" />
      </button>
    </Tooltip>
  );
}
