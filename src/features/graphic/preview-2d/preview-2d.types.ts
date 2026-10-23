import type { RefObject } from 'react';

export interface Preview2DProps {
  svg: string;
  empty: boolean;
  lengths: readonly number[];
  speed: number;
  /** Changing this replays the draw-on animation. */
  playKey: string;
  checker: boolean;
  onToggleChecker: () => void;
  onReplay: () => void;
}

export interface Preview2DViewProps extends Omit<Preview2DProps, 'lengths' | 'speed' | 'playKey'> {
  hostRef: RefObject<HTMLDivElement | null>;
}
