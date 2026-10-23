import { usePrintExport } from '../hooks/use-print-export';
import { usePrintPlan } from '../hooks/use-print-plan';
import type { PrintWorkspaceProps } from './print-workspace.types';
import { PrintWorkspaceView } from './PrintWorkspace.view';

/**
 * For people who want a desk object: big 3D preview, print setup, dot styles, model download.
 * The print plan is computed here, so it only exists while this workspace is open.
 */
export function PrintWorkspace({ settings, update, strokes, kinds, playKey, onReplay }: PrintWorkspaceProps) {
  const { plan, previewPlan } = usePrintPlan(strokes, kinds, settings.weight, settings.print);
  const { status, exportModel, busy } = usePrintExport(plan, settings.text);
  return (
    <PrintWorkspaceView
      settings={settings}
      plan={plan}
      previewPlan={previewPlan}
      playKey={playKey}
      onReplay={onReplay}
      status={status}
      busy={busy}
      onExport={exportModel}
      onPrintChange={print => update({ print })}
      onColorChange={color => update({ color })}
    />
  );
}
