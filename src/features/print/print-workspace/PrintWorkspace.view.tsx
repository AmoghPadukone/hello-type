import { Download } from 'lucide-react';
import { MobileCTA } from '@/components/layout/mobile-cta';
import { Button } from '@/components/ui/button';
import { PrintDotsPanel } from '../panels/print-dots-panel';
import { PrintDownloadPanel } from '../panels/print-download-panel';
import { PrintSetupPanel } from '../panels/print-setup-panel';
import { Preview3D } from '../preview-3d';
import type { PrintWorkspaceViewProps } from './print-workspace.types';

export function PrintWorkspaceView({
  settings,
  plan,
  previewPlan,
  playKey,
  onReplay,
  status,
  busy,
  onExport,
  onPrintChange,
  onColorChange,
}: PrintWorkspaceViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="lg:min-h-[540px]">
        <Preview3D
          plan={previewPlan}
          color={settings.color}
          speed={settings.speed}
          playKey={playKey}
          onReplay={onReplay}
        />
      </div>
      <aside className="space-y-4">
        <PrintSetupPanel
          settings={settings.print}
          color={settings.color}
          onChange={onPrintChange}
          onColor={onColorChange}
        />
        {plan && plan.dots > 0 && (
          <PrintDotsPanel settings={settings.print} count={plan.dots} onChange={onPrintChange} />
        )}
        <PrintDownloadPanel plan={plan} status={status} onExport={onExport} />
      </aside>
      <MobileCTA>
        <Button
          variant="primary"
          className="h-11 w-full"
          disabled={!plan || busy}
          loading={busy}
          onClick={() => onExport('3mf')}
          icon={<Download className="size-4" />}
        >
          Download 3MF
        </Button>
      </MobileCTA>
    </div>
  );
}
