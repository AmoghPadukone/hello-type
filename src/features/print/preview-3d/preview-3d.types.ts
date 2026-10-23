import type { RefObject } from 'react';
import type { PrintPlan } from '@/core/print/plan.types';

export interface Preview3DProps {
  plan: PrintPlan | null;
  color: string;
  speed: number;
  /** Changing this replays the draw-on animation. */
  playKey: string;
  onReplay: () => void;
}

export interface Preview3DViewProps {
  hostRef: RefObject<HTMLDivElement | null>;
  empty: boolean;
  failed: boolean;
  onResetView: () => void;
  onReplay: () => void;
}
