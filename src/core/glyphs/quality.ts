/**
 * Join-quality checks for composed text. In flat 2D, strokes that almost meet still look
 * joined because they overlap; as 3D tubes every round end cap shows. These checks find:
 *
 * - kink: a sharp change of direction where two segments of one stroke meet.
 * - loose-cap: a stroke end that sits near another stroke without ending inside it, which
 *   shows as a bump or a visible gap between two tube ends.
 *
 * Used by compose's `weld` (centreline, nearestOther) and by tests/core/glyphs/joins.test.ts,
 * which requires every letter pair to be clean.
 */
import { bezierPoint, direction } from '@/core/bezier';
import type { Point, Segment, Stroke, StrokeKind } from '@/core/types';
import type { CentrelineSample, JoinIssue } from './quality.types';

/**
 * Direction changes between these angles inside one stroke show as a crease in the tube.
 * Sharper turns are deliberate corners (z, k, cusps): the tube builder splits there and
 * draws a rounded elbow, which reads fine.
 */
const KINK_DEGREES = 20;
const ELBOW_DEGREES = 55;
/** A stroke end closer than this (in tube radii) to another stroke is "meant to join" it… */
export const JOIN_REACH = 2.4;
/** …and counts as properly joined only if it ends within this distance of its centreline. */
const EMBEDDED = 0.35;

const SAMPLES_PER_SEGMENT = 16;

/** Points along every stroke's centreline, with their arc length. */
export function centreline(strokes: readonly Stroke[]): CentrelineSample[] {
  const out: CentrelineSample[] = [];
  strokes.forEach((stroke, si) => {
    let s = 0;
    let prev: Point | null = null;
    for (const seg of stroke) {
      for (let i = prev ? 1 : 0; i <= SAMPLES_PER_SEGMENT; i++) {
        const p = bezierPoint(seg, i / SAMPLES_PER_SEGMENT);
        if (prev) s += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
        out.push({ p, stroke: si, s });
        prev = p;
      }
    }
  });
  return out;
}

const dist3 = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Outgoing (start) / incoming (end) tangent of a segment, skipping coincident control points. */
function segmentTangent(seg: Segment, atEnd: boolean): [number, number] {
  if (atEnd) {
    const from =
      [seg[2], seg[1], seg[0]].find(p => Math.hypot(p[0] - seg[3][0], p[1] - seg[3][1]) > 1e-3) ?? seg[0];
    return direction(from, seg[3]);
  }
  const to =
    [seg[1], seg[2], seg[3]].find(p => Math.hypot(p[0] - seg[0][0], p[1] - seg[0][1]) > 1e-3) ?? seg[3];
  return direction(seg[0], to);
}

/**
 * The nearest centreline point to `p` on any stroke other than `self`, or on `self` itself
 * far enough along it (more than `selfGap` of arc length from `selfS`) to be a real crossing.
 */
export function nearestOther(
  p: Point,
  line: readonly CentrelineSample[],
  self: number,
  selfS: number,
  selfGap: number,
): { sample: CentrelineSample; d: number } | null {
  let best: { sample: CentrelineSample; d: number } | null = null;
  for (const c of line) {
    if (c.stroke === self && Math.abs(c.s - selfS) < selfGap) continue;
    const d = dist3(p, c.p);
    if (!best || d < best.d) best = { sample: c, d };
  }
  return best;
}

/**
 * Checks one composed word or phrase. `terminals` lists stroke ends that are meant to be
 * free (word starts and ends); every other pen-stroke end that comes close to a stroke must
 * end inside it.
 */
export function analyzeJoins(
  strokes: readonly Stroke[],
  kinds: readonly StrokeKind[],
  reach: number = JOIN_REACH,
): JoinIssue[] {
  const issues: JoinIssue[] = [];
  const pen = strokes.map((s, i) => (kinds[i] === 'pen' ? s : null));
  const penStrokes = pen.filter((s): s is Stroke => s !== null);
  const indexOf = new Map(penStrokes.map((s, i) => [s, i]));
  const line = centreline(penStrokes);

  penStrokes.forEach((stroke, si) => {
    for (let i = 1; i < stroke.length; i++) {
      const a = segmentTangent(stroke[i - 1], true);
      const b = segmentTangent(stroke[i], false);
      const angle = (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))) * 180) / Math.PI;
      if (angle > KINK_DEGREES && angle < ELBOW_DEGREES)
        issues.push({ type: 'kink', at: [stroke[i][0][0], stroke[i][0][1]], amount: angle, stroke: si });
    }
    const length = line.filter(c => c.stroke === si).at(-1)?.s ?? 0;
    for (const atEnd of [false, true]) {
      const p = atEnd ? stroke[stroke.length - 1][3] : stroke[0][0];
      const r = p[3];
      const hit = nearestOther(p, line, si, atEnd ? length : 0, 4 * r);
      if (!hit) continue;
      const radii = hit.d / r;
      if (radii > EMBEDDED && radii < reach) {
        issues.push({
          type: 'loose-cap',
          at: [p[0], p[1]],
          amount: radii,
          stroke: indexOf.get(stroke) ?? si,
        });
      }
    }
  });
  return issues;
}
