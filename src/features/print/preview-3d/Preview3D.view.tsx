import { Maximize2, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/layout/empty-state';
import { PreviewCard } from '@/components/layout/preview-card';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import type { Preview3DViewProps } from './preview-3d.types';

export function Preview3DView({ hostRef, empty, failed, onResetView, onReplay }: Preview3DViewProps) {
  return (
    <PreviewCard
      className="lg:h-full xl:h-full"
      label="3D print preview · drag to rotate"
      actions={
        <>
          <Tooltip content="Reset view">
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetView}
              icon={<Maximize2 className="size-3.5" />}
              aria-label="Reset view"
            />
          </Tooltip>
          <Tooltip content="Replay">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReplay}
              icon={<RotateCcw className="size-3.5" />}
              aria-label="Replay drawing"
            />
          </Tooltip>
        </>
      }
    >
      <div
        ref={hostRef}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing [&_canvas]:block [&_canvas]:size-full"
      />
      {failed && <p className="text-sm text-fg-subtle">3D preview unavailable (WebGL is required).</p>}
      {empty && !failed && <EmptyState />}
    </PreviewCard>
  );
}
