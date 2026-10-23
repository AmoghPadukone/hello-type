export interface SvgOptions {
  color?: string;
  /** Stroke width in glyph units; Apple's is 60. */
  width?: number;
  /** Add a CSS draw-on animation (strokes drawn one after another). */
  animate?: boolean;
  /** Length of each stroke in glyph units, for animation timing. */
  lengths?: readonly number[];
  speed?: number;
}
