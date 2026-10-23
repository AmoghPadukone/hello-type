/**
 * How i/j dots become printable. Apple's dots float above their stems, which would print as
 * loose parts, so each style either joins the dot to the stem or replaces it with a stroke
 * that grows out of the stem. Shapes are built procedurally from two anchors (the stem top S
 * and the original dot D), so they fit every i and j at any size and depth.
 */
import { PREVIEW_QUALITY } from '@/core/print/geometry/tube.constants';
import { samplePieces } from '@/core/print/geometry/tube';
import type { Sample } from '@/core/print/geometry/tube.types';
import { length, sub, type Vec3 } from '@/core/print/geometry/vec';
import { strokeLength } from '@/core/svg/svg';
import type { Point, Segment, Stroke, StrokeKind } from '@/core/types';
import { DOT_STYLES, MARK_OVERLAP, MIN_ROD_MM } from './dots.constants';
import type { DotResult, DotStyle } from './dots.types';

export const isDotStyle = (v: unknown): v is DotStyle => DOT_STYLES.some(s => s.id === v);

const isDot = (stroke: Stroke) => strokeLength(stroke) < 1;

function samplesOf(stroke: Stroke, radiusScale: number): Sample[] {
  return samplePieces(stroke, radiusScale, PREVIEW_QUALITY.step).flat();
}

const line = (a: Point, b: Point): Segment => {
  const lerp = (t: number): Point => a.map((v, k) => v + (b[k] - v) * t) as Point;
  return [a, lerp(1 / 3), lerp(2 / 3), b];
};

const translateStroke = (stroke: Stroke, [dx, dy, dz]: Vec3): Stroke =>
  stroke.map(seg => seg.map(([x, y, z, r]) => [x + dx, y + dy, z + dz, r]) as Segment);

/**
 * Moves a mark straight toward its nearest point on the word until the tubes overlap.
 * Used for crossbars that sit at a different depth from their stem, and the "bead" dot.
 */
function attach(stroke: Stroke, pen: Sample[], radiusScale: number): Stroke {
  let best = { d: Infinity, from: [0, 0, 0] as Vec3, to: [0, 0, 0] as Vec3, reach: 0 };
  for (const m of samplesOf(stroke, radiusScale)) {
    for (const p of pen) {
      const d = length(sub(p.c, m.c)) - (m.r + p.r);
      if (d < best.d) best = { d, from: m.c, to: p.c, reach: m.r + p.r };
    }
  }
  if (best.d < -best.reach * (1 - MARK_OVERLAP)) return stroke; // already overlapping enough
  const gap = sub(best.to, best.from);
  const dist = length(gap);
  const k = (dist - best.reach * MARK_OVERLAP) / dist;
  return translateStroke(stroke, [gap[0] * k, gap[1] * k, gap[2] * k]);
}

/** The stem top under a dot: the nearest point of the word below it (glyph units, unscaled radius). */
function stemTop(dot: Point, pen: Sample[], radiusScale: number): Point {
  let best = pen[0];
  let bestD = Infinity;
  for (const p of pen) {
    if (p.c[1] >= dot[1]) continue;
    const d = Math.hypot(p.c[0] - dot[0], p.c[1] - dot[1]);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return [best.c[0], best.c[1], best.c[2], best.r / radiusScale];
}

/**
 * Builds a dot style. Coordinates are given in a frame anchored at the stem top S: `a` runs
 * toward the dot (1 = the dot's height), `b` to the right of that direction, both in units of
 * the stem-to-dot distance. `dz` offsets depth from S, `r` is the tube radius at that point.
 */
function styleStrokes(style: DotStyle, S: Point, D: Point, rod: number): { add: Stroke[]; keepDot: boolean } {
  const ux = D[0] - S[0],
    uy = D[1] - S[1];
  const d = Math.hypot(ux, uy) || 1;
  const [ax, ay] = [ux / d, uy / d];
  const [bx, by] = [ay, -ax]; // right of the stem → dot direction
  const r0 = D[3];
  const P = (a: number, b: number, dz = 0, r = r0): Point => [
    S[0] + (ax * a + bx * b) * d,
    S[1] + (ay * a + by * b) * d,
    S[2] + dz,
    r,
  ];
  const depthTo = (t: number) => (D[2] - S[2]) * t;

  switch (style) {
    case 'teardrop':
      // A slim neck that swells toward the tip, so the round end cap reads as the dot. It starts
      // a little inside the stem, already slim, so its own start cap is hidden in the stem.
      return {
        add: [
          [
            [
              P(-0.25, 0, 0, r0 * 0.62),
              P(0.3, 0.03, depthTo(0.33), r0 * 0.62),
              P(0.7, 0.16, depthTo(0.66), r0 * 0.85),
              P(1, 0.22, depthTo(1), r0 * 1.45),
            ],
          ],
        ],
        keepDot: false,
      };
    case 'curl': {
      // Rises to the right, rolls back over the top and tucks in; the spiral drifts behind.
      const back = -1.6 * r0;
      return {
        add: [
          [
            [P(0, 0), P(0.35, 0.02, back * 0.1), P(0.65, 0.42, back * 0.25), P(0.95, 0.4, back * 0.4)],
            [
              P(0.95, 0.4, back * 0.4),
              P(1.25, 0.37, back * 0.55),
              P(1.32, -0.08, back * 0.7),
              P(1.07, -0.12, back * 0.8),
            ],
            [P(1.07, -0.12, back * 0.8), P(0.85, -0.15, back * 0.9), P(0.8, 0.14, back), P(1.0, 0.18, back)],
          ],
        ],
        keepDot: false,
      };
    }
    case 'swash':
      return {
        add: [
          [
            [
              P(0, 0, 0, rod),
              P(0.3, -0.35, depthTo(0.33), rod),
              P(0.65, 0.4, depthTo(0.66), rod),
              [...D.slice(0, 3), rod] as Point,
            ],
          ],
        ],
        keepDot: true,
      };
    case 'loop': {
      // Up the left behind the stem, over the top at dot height, down the right in front.
      const back = -1.3 * r0,
        front = 0.6 * r0;
      return {
        add: [
          [
            [P(0, 0), P(0.3, -0.45, back * 0.5), P(1.15, -0.42, back), P(1.15, 0, (back + front) / 2)],
            [P(1.15, 0, (back + front) / 2), P(1.15, 0.42, front), P(0.3, 0.45, front * 0.5), P(0, 0)],
          ],
        ],
        keepDot: false,
      };
    }
    case 'tether':
      return {
        add: [[line([...S.slice(0, 3), rod] as Point, [...D.slice(0, 3), rod] as Point)]],
        keepDot: true,
      };
    case 'backrod': {
      // From the dot, swing behind the word and rejoin the stem a little below its top.
      const behind = Math.min(S[2], D[2]) - S[2] - 2 * r0;
      return {
        add: [
          [
            [
              [...D.slice(0, 3), rod] as Point,
              P(0.95, 0.3, behind, rod),
              P(0.25, 0.3, behind, rod),
              P(-0.3, 0, 0, rod),
            ],
          ],
        ],
        keepDot: true,
      };
    }
    case 'accent':
      return { add: [[line(P(0, 0), P(1, 0.28, depthTo(1)))]], keepDot: false };
    default:
      return { add: [], keepDot: true };
  }
}

/**
 * Applies a dot style to every i/j dot (zero-length mark), and attaches any other mark
 * (crossbars) that doesn't already touch the word. `mmPerUnit` sets the minimum rod size.
 */
export function applyDots(
  strokes: readonly Stroke[],
  kinds: readonly StrokeKind[],
  radiusScale: number,
  mmPerUnit: number,
  style: DotStyle,
): DotResult {
  const pen = strokes.flatMap((s, i) => (kinds[i] === 'pen' ? samplesOf(s, radiusScale) : []));
  const out: DotResult = { strokes: [], kinds: [], previewOnly: [], pins: [], dots: 0 };
  const push = (s: Stroke, k: StrokeKind) => {
    out.strokes.push(s);
    out.kinds.push(k);
  };

  strokes.forEach((stroke, i) => {
    if (kinds[i] === 'pen' || !pen.length) return push(stroke, kinds[i]);
    if (!isDot(stroke)) return push(attach(stroke, pen, radiusScale), 'mark');

    out.dots++;
    const D = stroke[0][0];
    if (style === 'floating') return push(stroke, 'mark');
    if (style === 'bead') return push(attach(stroke, pen, radiusScale), 'mark');
    const S = stemTop(D, pen, radiusScale);
    if (style === 'pin') {
      out.pins.push({ stem: S, dot: D });
      out.previewOnly.push(stroke);
      return;
    }
    const rod = Math.max(D[3] * 0.45, MIN_ROD_MM / 2 / mmPerUnit / radiusScale);
    const { add, keepDot } = styleStrokes(style, S, D, rod);
    for (const s of add) push(s, 'mark');
    if (keepDot) push(stroke, 'mark');
  });
  return out;
}
