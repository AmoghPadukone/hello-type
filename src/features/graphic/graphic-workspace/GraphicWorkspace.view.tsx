import { Download } from 'lucide-react';
import { MobileCTA } from '@/components/layout/mobile-cta';
import { Button } from '@/components/ui/button';
import { AppearancePanel } from '../appearance-panel';
import { ExportPanel } from '../export-panel';
import { Preview2D } from '../preview-2d';
import type { GraphicWorkspaceViewProps } from './graphic-workspace.types';

export function GraphicWorkspaceView({
  settings,
  update,
  svg,
  empty,
  lengths,
  playKey,
  onReplay,
  onToggleChecker,
  exports,
}: GraphicWorkspaceViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Preview2D
        svg={svg}
        empty={empty}
        lengths={lengths}
        speed={settings.speed}
        playKey={playKey}
        checker={settings.checker}
        onToggleChecker={onToggleChecker}
        onReplay={onReplay}
      />
      <aside className="space-y-4">
        <AppearancePanel settings={settings} update={update} />
        <ExportPanel disabled={empty} {...exports} />
      </aside>
      <MobileCTA>
        <Button
          variant="primary"
          className="h-11 w-full"
          disabled={empty}
          onClick={exports.onSvg}
          icon={<Download className="size-4" />}
        >
          Download SVG
        </Button>
      </MobileCTA>
    </div>
  );
}
