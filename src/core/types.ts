/**
 * Geometry types shared by every stage, from glyph data to the printed solid. Read this first.
 *
 * Coordinates are glyph units (Apple's: baseline 0, x-height ≈ 380, ascender ≈ 737), y up.
 * A point carries depth and radius as well as position: `z` is how far the pen sweeps in
 * front of (+) or behind (−) the writing plane in Apple's 3D "hello", and `r` is the tube
 * radius (≈ 30). The 2D SVG uses only x/y.
 */

export type Point = [x: number, y: number, z: number, r: number];

/** A cubic Bézier segment: start, two control points, end. */
export type Segment = [Point, Point, Point, Point];

/** One continuous pen stroke. */
export type Stroke = Segment[];

/** `pen` strokes form the word; `mark` strokes (i/j dots, t/x crossbars) are added after it. */
export type StrokeKind = 'pen' | 'mark';
