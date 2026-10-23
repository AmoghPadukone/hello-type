import type { Point } from '@/core/types';

export interface JoinIssue {
  type: 'kink' | 'loose-cap';
  at: [number, number];
  /** Kink angle in degrees, or the cap's distance to the nearest stroke in tube radii. */
  amount: number;
  stroke: number;
}

export interface CentrelineSample {
  p: Point;
  stroke: number;
  /** Arc length from the stroke's start. */
  s: number;
}
