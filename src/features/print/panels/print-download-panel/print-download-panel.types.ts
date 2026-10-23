import type { PrintEstimate, PrintPlan } from '@/core/print/plan.types';
import type { ExportFormat, ExportStatus } from '../../print.types';

export interface PrintDownloadPanelProps {
  plan: PrintPlan | null;
  status: ExportStatus;
  onExport: (format: ExportFormat) => void;
}

export interface PrintDownloadPanelViewProps extends PrintDownloadPanelProps {
  estimate: PrintEstimate | null;
}
