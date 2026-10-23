import type { Stroke } from '@/core/types';
import type { DotStyle, Pin } from './dots/dots.types';
import type { Vec3 } from './geometry/vec';

export type Orientation = 'stand' | 'flat';
export type StandBase = 'feet' | 'plate';

export interface PrintSettings {
  /** Tube thickness relative to Apple's proportion (1 = Apple's). */
  thickness: number;
  /** Share of Apple's front/back swing (1 = true over-and-under loops, lower fuses crossings). */
  depth: number;
  /** Width of the lettering in millimetres (a base plate adds its margin on each side). */
  widthMM: number;
  orientation: Orientation;
  /** Standing: millimetres sliced off the bottom to make flat feet. */
  feetMM: number;
  base: StandBase;
  /** Base plate thickness in millimetres. */
  plateMM: number;
  /** How far the base plate reaches past the letters on every side, in millimetres. */
  plateMarginMM: number;
  /** Lying flat: share of the tube radius shaved off the back (0 = round). */
  flatBack: number;
  /** How i/j dots are made printable. */
  dots: DotStyle;
}

export interface StandMetrics {
  /** Lowest tube bottom among the main letters (excludes descender loops). */
  footY: number;
  /** Highest foot bottom: letters whose feet sit this high would float above a plate cut at footY. */
  footTopY: number;
  /** Lowest point overall. */
  lowY: number;
  maxY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  hasDescenders: boolean;
}

/** An axis-aligned slab with rounded edges, in glyph units. */
export interface Plate {
  min: Vec3;
  max: Vec3;
  round: number;
}

/** Everything the 3D preview and the exporter must agree on, in glyph units. */
export interface PrintPlan {
  strokes: Stroke[];
  radiusScale: number;
  /** Millimetres per glyph unit. */
  s: number;
  metrics: StandMetrics;
  orientation: Orientation;
  /** Everything below `at` on `axis` (1 = y for standing, 2 = z for a flat back) is removed. */
  cut: { axis: 1 | 2; at: number } | null;
  plate: Plate | null;
  /** Strokes drawn in the 3D preview but not part of the main solid (pin-and-socket dots). */
  previewOnly: Stroke[];
  /** Dots exported as separate parts with a peg, plus a socket in their stem. */
  pins: Pin[];
  dotStyle: DotStyle;
  /** Number of i/j dots in the text. */
  dots: number;
}

/** Approximate finished size (millimetres) and warnings, from the plan alone. */
export interface PrintEstimate {
  widthMM: number;
  heightMM: number;
  depthMM: number;
  tubeMM: number;
  warnings: string[];
}
