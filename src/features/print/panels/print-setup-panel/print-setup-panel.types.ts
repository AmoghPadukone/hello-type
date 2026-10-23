import type { PrintSettings } from '@/core/print/plan.types';

export interface PrintSetupPanelProps {
  settings: PrintSettings;
  color: string;
  onChange: (patch: Partial<PrintSettings>) => void;
  onColor: (color: string) => void;
}
