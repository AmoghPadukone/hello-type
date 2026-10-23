/**
 * Cubic Bézier maths shared by composition, the join checks, the SVG timing and the tube mesher.
 * Every component of a point is interpolated, so depth and radius vary smoothly along a stroke
 * just as position does.
 */
import type { Point, Segment } from '@/core/types';

/** The point at parameter t (0 = start, 1 = end) of a cubic segment. */
export function bezierPoint(seg: Segment, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u,
    w1 = 3 * u * u * t,
    w2 = 3 * u * t * t,
    w3 = t * t * t;
  const at = (k: number) => w0 * seg[0][k] + w1 * seg[1][k] + w2 * seg[2][k] + w3 * seg[3][k];
  return [at(0), at(1), at(2), at(3)];
}

/** The x/y vector (x, y) scaled to length 1 (or left at zero). */
export function unit(x: number, y: number): [number, number] {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

/** Unit x/y direction from a to b. */
export const direction = (a: Point, b: Point): [number, number] => unit(b[0] - a[0], b[1] - a[1]);
