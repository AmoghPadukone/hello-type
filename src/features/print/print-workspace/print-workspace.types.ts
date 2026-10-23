import type { PrintPlan, PrintSettings } from '@/core/print/plan.types';
import type { Stroke, StrokeKind } from '@/core/types';
import type { Settings, UpdateSettings } from '@/settings';
import type { ExportFormat, ExportStatus } from '../print.types';

export interface PrintWorkspaceProps {
  settings: Settings;
  update: UpdateSettings;
  strokes: readonly Stroke[];
  kinds: readonly StrokeKind[];
  /** Changing this replays the draw-on animation. */
  playKey: string;
  onReplay: () => void;
}

export interface PrintWorkspaceViewProps {
  settings: Settings;
  plan: PrintPlan | null;
  /** Debounced copy of `plan` for the 3D preview. */
  previewPlan: PrintPlan | null;
  playKey: string;
  onReplay: () => void;
  status: ExportStatus;
  busy: boolean;
  onExport: (format: ExportFormat) => void;
  onPrintChange: (patch: Partial<PrintSettings>) => void;
  onColorChange: (color: string) => void;
}
