import { useRef } from 'react';
import { useViewer } from '../hooks/use-viewer';
import type { Preview3DProps } from './preview-3d.types';
import { Preview3DView } from './Preview3D.view';

export function Preview3D({ plan, color, speed, playKey, onReplay }: Preview3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const { viewer, failed } = useViewer(host, plan, color, speed, playKey);
  return (
    <Preview3DView
      hostRef={host}
      empty={!plan}
      failed={failed}
      onResetView={() => viewer?.resetView()}
      onReplay={onReplay}
    />
  );
}
