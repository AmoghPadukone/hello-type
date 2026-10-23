import type { Point, Stroke, StrokeKind } from '@/core/types';

export type DotStyle =
  'teardrop' | 'curl' | 'swash' | 'loop' | 'tether' | 'backrod' | 'accent' | 'bead' | 'pin' | 'floating';

export interface DotStyleInfo {
  id: DotStyle;
  label: string;
  description: string;
  /** Prints as one piece with the word. */
  connected: boolean;
}

/** A dot that prints separately with a peg, fitting a socket drilled into its stem. */
export interface Pin {
  /** Stem top (socket axis), glyph units. */
  stem: Point;
  /** Original dot centre and radius. */
  dot: Point;
}

export interface DotResult {
  strokes: Stroke[];
  kinds: StrokeKind[];
  /** Strokes shown in the 3D preview only (pin dots, which are exported as separate parts). */
  previewOnly: Stroke[];
  pins: Pin[];
  /** Number of i/j dots found. */
  dots: number;
}
