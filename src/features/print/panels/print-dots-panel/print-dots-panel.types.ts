import type { PrintSettings } from '@/core/print/plan.types';

export interface PrintDotsPanelProps {
  settings: PrintSettings;
  /** Number of i/j dots in the text. */
  count: number;
  onChange: (patch: Partial<PrintSettings>) => void;
}
