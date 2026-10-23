import { Grid2x2, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/layout/empty-state';
import { PreviewCard } from '@/components/layout/preview-card';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import type { Preview2DViewProps } from './preview-2d.types';

export function Preview2DView({
  hostRef,
  svg,
  empty,
  checker,
  onToggleChecker,
  onReplay,
}: Preview2DViewProps) {
  return (
    <PreviewCard
      label="2D · SVG"
      className={cn(checker && 'checker')}
      actions={
        <>
          <Tooltip content="Transparency grid">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={checker}
              onClick={onToggleChecker}
              icon={<Grid2x2 className="size-3.5" />}
              className={cn(checker && 'text-fg')}
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
      {empty ? (
        <EmptyState />
      ) : (
        <div
          ref={hostRef}
          className="w-full px-6 py-10 sm:px-10 [&_svg]:mx-auto [&_svg]:max-h-[420px] [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </PreviewCard>
  );
}
