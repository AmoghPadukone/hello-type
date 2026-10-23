import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TOOLTIP_DELAY_MS } from '@/config/constants';

/** App-wide context providers. */
export function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>{children}</TooltipProvider>;
}
