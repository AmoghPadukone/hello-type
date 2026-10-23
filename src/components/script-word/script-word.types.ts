import type { RefObject } from 'react';

export interface ScriptWordProps {
  text: string;
  className?: string;
}

export interface ScriptWordViewProps extends ScriptWordProps {
  hostRef: RefObject<HTMLSpanElement | null>;
  svg: string;
  /** Height of the svg, in em. */
  height: number;
  /** Distance from the svg's bottom edge to the baseline, in em. */
  drop: number;
}
