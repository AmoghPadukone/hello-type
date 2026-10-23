/**
 * Text → pen strokes. Lays glyphs out into strokes: letters chain at baseline minima (where
 * the pen bottoms out with a horizontal tangent), so a low exit flows straight into the next
 * letter's lead. After a high exit (o b v w) or a descender's rising exit, the lead is replaced
 * by a generated connector. Each word ends with `weld`, which makes every join exact for 3D.
 *
 * Reading order: stroke helpers, weld, spacing, then WordWriter (one word, letter by letter)
 * and `compose` (a line of words).
 */
import { bezierPoint, direction } from '@/core/bezier';
import type { Point, Segment, Stroke, StrokeKind } from '@/core/types';
import {
  BAR_DIP,
  CLEAR_MAX,
  CLEAR_STEP,
  CLEARANCE,
  ENTRY_REACH,
  EYE_MARGIN,
  HIGH_PULL,
  LETTER_GAP,
  LOW_ENTRY_Y,
  MIN_CONNECTOR,
  RISE_GAP,
  TAIL_LENGTH,
  TIGHT_GAP,
  WORD_GAP,
} from './compose.constants';
import rawGlyphData from './glyph-data.json';
import type { Bounds, Composition, Glyph, GlyphData } from './glyph.types';
import { centreline, JOIN_REACH, nearestOther } from './quality';

const data = rawGlyphData as unknown as GlyphData;
export const GLYPHS: Readonly<Record<string, Glyph>> = data.glyphs;
export const SUPPORTED = Object.keys(GLYPHS).sort().join('');

// Stroke helpers -------------------------------------------------------------------------------

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];
const startOf = (segs: Stroke): Point => segs[0][0];
const endOf = (segs: Stroke): Point => last(segs)[3];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const translate = (segs: Stroke, dx: number, dy = 0): Stroke =>
  segs.map(seg => seg.map(([x, y, z, r]) => [x + dx, y + dy, z, r]) as Segment);

/** Direction the pen is travelling at the end of a stroke (x/y). */
function tangentIn(segs: Stroke): [number, number] {
  const [, p1, p2, p3] = last(segs);
  const from = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) > 1e-3 ? p2 : p1;
  return direction(from, p3);
}

/** Direction the pen sets off in at the start of a stroke (x/y). */
const tangentOut = (segs: Stroke): [number, number] => direction(startOf(segs), segs[0][1]);

/**
 * Cubic from p (leaving along tp) to q (arriving along tq); depth and radius blend linearly.
 * `pull` weights the two handles: a long leaving handle and a short arriving one make the
 * stroke glide flat out of the previous letter and turn up only at the end.
 */
function connector(
  p: Point,
  tp: [number, number],
  q: Point,
  tq: [number, number],
  pull = [0.4, 0.4],
): Segment {
  const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const depth = (t: number): [number, number] => [lerp(p[2], q[2], t), lerp(p[3], q[3], t)];
  return [
    p,
    [p[0] + tp[0] * d * pull[0], p[1] + tp[1] * d * pull[0], ...depth(1 / 3)],
    [q[0] - tq[0] * d * pull[1], q[1] - tq[1] * d * pull[1], ...depth(2 / 3)],
    q,
  ];
}

/**
 * Moves a stroke's first point onto `to`: position via the first control pair, depth and
 * radius eased in across the first segment so the tube has no step.
 */
function snapStart(segs: Stroke, to: Point): Stroke {
  const s = startOf(segs);
  const d = to.map((v, k) => v - s[k]);
  const weights = [1, 2 / 3, 1 / 3, 0];
  const first = segs[0].map(([x, y, z, r], j) => {
    const pos = j < 2 ? 1 : 0;
    return [x + d[0] * pos, y + d[1] * pos, z + d[2] * weights[j], r + d[3] * weights[j]];
  }) as Segment;
  return [first, ...segs.slice(1)];
}

/** Moves a stroke's last point onto `to`, mirroring snapStart. */
function snapEnd(segs: Stroke, to: Point): Stroke {
  const lastSeg = segs[segs.length - 1];
  const e = lastSeg[3];
  const d = to.map((v, k) => v - e[k]);
  const weights = [0, 1 / 3, 2 / 3, 1];
  const moved = lastSeg.map(([x, y, z, r], j) => {
    const pos = j >= 2 ? 1 : 0;
    return [x + d[0] * pos, y + d[1] * pos, z + d[2] * weights[j], r + d[3] * weights[j]];
  }) as Segment;
  return [...segs.slice(0, -1), moved];
}

/** de Casteljau split of a segment at t, interpolating depth and radius too. */
function splitSegment(seg: Segment, t: number): [Segment, Segment] {
  const mix = (a: Point, b: Point): Point => a.map((v, k) => v + (b[k] - v) * t) as Point;
  const [p0, p1, p2, p3] = seg;
  const a = mix(p0, p1),
    b = mix(p1, p2),
    c = mix(p2, p3);
  const d = mix(a, b),
    e = mix(b, c);
  const m = mix(d, e);
  return [
    [p0, a, d, m],
    [m, e, c, p3],
  ];
}

/** The last `share` of a stroke (by segment parameter), e.g. the top of a lead-in. */
function strokeTail(segs: Stroke, share: number): Stroke {
  const t = segs.length * (1 - share);
  const i = Math.min(Math.floor(t), segs.length - 1);
  return [splitSegment(segs[i], t - i)[1], ...segs.slice(i + 1)];
}

// Weld -----------------------------------------------------------------------------------------

/**
 * Welds near-miss joins: a stroke end that comes within JOIN_REACH tube radii of another
 * stroke (or a far part of itself) is moved onto that stroke's centreline, taking its depth
 * and at most its radius, so the round end cap sits inside the tube instead of showing as a
 * bump or a gap. Apple's 2D strokes overlap loosely; 3D tubes need exact joins.
 */
function weld(strokes: Stroke[]): Stroke[] {
  const out = [...strokes];
  // One end at a time against the current geometry, so two ends that meet don't both move
  // toward where the other used to be. Welding one end can shift a curve another end was
  // welded to, so repeat until nothing moves (it settles within a couple of passes).
  for (let pass = 0; pass < 4; pass++) {
    if (!weldPass(out)) break;
  }
  return out;
}

function weldPass(out: Stroke[]): boolean {
  let moved = false;
  for (let si = 0; si < out.length; si++) {
    for (const atEnd of [false, true]) {
      const line = centreline(out);
      const length = line.filter(c => c.stroke === si).at(-1)?.s ?? 0;
      const stroke = out[si];
      const p = atEnd ? stroke[stroke.length - 1][3] : stroke[0][0];
      const hit = nearestOther(p, line, si, atEnd ? length : 0, 4 * p[3]);
      if (!hit || hit.d < 0.5 || hit.d > JOIN_REACH * p[3]) continue;
      const q = hit.sample.p;
      const target: Point = [q[0], q[1], q[2], Math.min(p[3], q[3])];
      out[si] = atEnd ? snapEnd(stroke, target) : snapStart(stroke, target);
      moved = true;
    }
  }
  return moved;
}

// Spacing --------------------------------------------------------------------------------------

/** Points along a cubic (x/y). */
function sampleSegment(seg: Segment, n: number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const [x, y] = bezierPoint(seg, i / n);
    return [x, y];
  });
}

const samples = (strokes: readonly Stroke[]) =>
  strokes.flatMap(s => s.flatMap(seg => sampleSegment(seg, 12)));

/** Whether points shifted by dx stay `widths` tube widths from all of `previous`. */
function apart(
  points: [number, number][],
  dx: number,
  previous: [number, number][],
  r: number,
  widths = LETTER_GAP,
): boolean {
  const gap = widths * 2 * r;
  return points.every(([bx, by]) => previous.every(([px, py]) => Math.hypot(bx + dx - px, by - py) > gap));
}

/**
 * The smallest extra shift that keeps a hiTight letter clear of the letter before it, apart
 * from where it is entered.
 */
function apartShift(entry: Point, ox: number, body: readonly Stroke[], before: readonly Stroke[]): number {
  const near = ENTRY_REACH * 2 * entry[3];
  const own = samples(body).filter(([x, y]) => Math.hypot(x - entry[0], y - entry[1]) > near);
  const previous = samples(before);
  for (let extra = 0; extra <= CLEAR_MAX; extra += CLEAR_STEP) {
    if (apart(own, ox + extra, previous, entry[3], TIGHT_GAP)) return extra;
  }
  return CLEAR_MAX;
}

/**
 * The smallest extra shift (glyph units) that keeps a connector from `p` to the entry clear of
 * the letter's own strokes, ignoring the stretch right where it arrives.
 */
function clearShift(
  p: Point,
  tp: [number, number],
  entry: Point,
  tq: [number, number],
  ox: number,
  g: Glyph,
  before: readonly Stroke[],
): number {
  const all = samples(g.body);
  // Only the part of the letter above its entry (e's eye) is protected from the connector;
  // merging into the lower-left of the letter is how a cursive entry stroke joins anyway.
  const eye = all.filter(([, y]) => y > entry[1] + EYE_MARGIN);
  const previous = samples(before);
  const reach = CLEARANCE * 2 * entry[3];
  for (let extra = 0; extra <= CLEAR_MAX; extra += CLEAR_STEP) {
    const dx = ox + extra;
    const q: Point = [entry[0] + dx, entry[1], entry[2], entry[3]];
    // 1. The letter must not overlap the letter before it.
    if (!apart(all, dx, previous, entry[3])) continue;
    // 2. The connector must not cut through the letter's eye.
    const path = sampleSegment(connector(p, tp, q, tq, HIGH_PULL), 24);
    const clear = path.every(([x, y]) => {
      if (Math.hypot(x - q[0], y - q[1]) < 2.5 * reach) return true; // arriving: it joins here
      return eye.every(([bx, by]) => Math.hypot(x - (bx + dx), y - by) > reach);
    });
    if (clear) return extra;
  }
  return CLEAR_MAX;
}

/**
 * A glyph's crossbar: its only mark, when that is a flat stroke with some length (the t's; the
 * x's marks are diagonal and the i/j dots have no length).
 */
function crossbar(g: Glyph): Stroke | null {
  if (g.marks.length !== 1) return null;
  const bar = g.marks[0];
  const a = startOf(bar);
  const b = endOf(bar);
  return Math.abs(b[1] - a[1]) < 10 && b[0] - a[0] > 100 ? bar : null;
}

/**
 * Two cubics that sag to a soft trough and rise back onto the bar's height, level at the
 * start, trough and end, so the join curves without a dip or a kink.
 */
function dipToBar(p: Point, q: Point): Stroke {
  const mid: Point = [
    p[0] + (q[0] - p[0]) * 0.5,
    Math.min(p[1], q[1]) - BAR_DIP,
    (p[2] + q[2]) / 2,
    (p[3] + q[3]) / 2,
  ];
  const half = (a: Point, b: Point): Segment => {
    const d = (b[0] - a[0]) * 0.5;
    return [a, [a[0] + d, a[1], a[2], a[3]], [b[0] - d, b[1], b[2], b[3]], b];
  };
  return [half(p, mid), half(mid, q)];
}

/**
 * A descender's rising exit stops just past its own stem; at the end of a word it is carried on
 * a little so the tube's end isn't left touching the stem.
 */
function risingTail([x, y, z, r]: Point, [tx, ty]: [number, number]): Segment {
  const L = TAIL_LENGTH;
  return [
    [x, y, z, r],
    [x + tx * L * 0.4, y + ty * L * 0.4, z, r],
    [x + tx * L * 0.8, y + ty * L * 0.7, z, r],
    [x + tx * L, y + ty * L * 0.8, z, r],
  ];
}

// Writing a word -------------------------------------------------------------------------------

/** How the previous letter left the pen. */
interface PenState {
  type: Glyph['exitType'];
  exit: Point;
  detached: boolean;
  tangent: [number, number];
  /** Extra room after this exit (Glyph.exitGap). */
  gap: number;
  /** Share of the high link kept before a hiTight letter (Glyph.linkCut). */
  linkCut: number;
  /** Extra room after a high exit, whatever follows (Glyph.exitRoom). */
  room: number;
  /** Where the pen was before an optional rising tail (see Glyph.tailSegs). */
  beforeTail: { segs: number; exit: Point; tangent: [number, number] } | null;
}

/** Where the pen is once letter `g`, placed at `ox` with `body`, has been drawn ending in `stroke`. */
function penAfter(g: Glyph, body: Stroke[], ox: number, stroke: Stroke): PenState {
  return {
    type: g.exitType,
    exit: body !== g.body ? endOf(stroke) : [g.exit[0] + ox, g.exit[1], g.exit[2], g.exit[3]],
    detached: g.detached,
    gap: g.exitGap,
    linkCut: g.linkCut,
    room: g.exitRoom,
    tangent: g.detached ? [1, 0] : tangentIn(stroke),
    beforeTail:
      g.tailSegs && stroke.length > g.tailSegs
        ? {
            segs: g.tailSegs,
            exit: stroke[stroke.length - 1 - g.tailSegs][3],
            tangent: tangentIn(stroke.slice(0, stroke.length - g.tailSegs)),
          }
        : null,
  };
}

/** A letter's position and what to draw of it: `lead` runs into `body`, both shifted by `ox`. */
interface Placement {
  ox: number;
  lead: Stroke[];
  body: Stroke[];
}

/**
 * Lays out one word, letter by letter, tracking the pen: the stroke it is drawing (`open`, null
 * once the pen lifts) and how the previous letter left it (`prev`).
 */
class WordWriter {
  readonly strokes: Stroke[] = [];
  readonly marks: Stroke[] = [];
  private open: Stroke | null = null;
  private prev: PenState | null = null;

  write(g: Glyph): void {
    const prev = this.prev;
    const { ox, lead, body } = !prev
      ? { ox: 0, lead: g.initial ?? (g.tail ? [] : g.lead), body: g.body }
      : prev.type === 'low'
        ? // s's curl ends right beside where a bowl letter's left edge would land, so they'd fuse into
          // one blob: exitGap pushes every following letter clear of it (its lead-in stretches into a connector).
          { ox: prev.exit[0] + prev.gap, lead: g.lead, body: g.body }
        : this.connect(prev, g);

    lead.forEach((s, i) => {
      let segs = translate(s, ox);
      if (i === 0 && prev?.type === 'low') {
        segs = snapStart(segs, prev.exit);
        if (this.open && !prev.detached) {
          this.open.push(...segs);
          return;
        }
      }
      this.open = this.penDown(segs);
    });
    if (lead.length && !g.join) this.open = null;

    body.forEach((s, i) => {
      const segs = translate(s, ox);
      if (i === 0) this.draw(segs);
      else this.open = this.penDown(segs);
    });
    if (!(prev?.type === 'high' && crossbar(g))) this.marks.push(...g.marks.map(s => translate(s, ox)));

    const lastStroke = last(this.strokes);
    this.prev = penAfter(g, body, ox, lastStroke);
    this.open = g.detached ? null : lastStroke;
  }

  /** Ends the word (a flick after a low exit, a short tail after a rising one) and welds it. */
  finish(): { strokes: Stroke[]; marks: Stroke[] } {
    const prev = this.prev;
    if (prev?.type === 'low') {
      this.draw(snapStart(translate(data.flick, prev.exit[0], prev.exit[1]), prev.exit));
    } else if (prev?.type === 'rise' && this.open) {
      this.open.push(risingTail(prev.exit, prev.tangent));
    }
    return { strokes: weld(this.strokes), marks: this.marks };
  }

  /** Starts a new stroke. */
  private penDown(segs: Stroke): Stroke {
    const s = [...segs];
    this.strokes.push(s);
    return s;
  }

  /** Continues the open stroke, or starts one if the pen is up. */
  private draw(segs: Stroke): Stroke {
    if (this.open) this.open.push(...segs);
    else this.open = this.penDown(segs);
    return this.open;
  }

  /**
   * Places a letter after a high or rising exit. Its lead is dropped and a connector is drawn
   * from the pen to where the letter is entered; the pen's own exit may be trimmed first.
   */
  private connect(prev: PenState, g: Glyph): Placement {
    const high = prev.type === 'high';
    // A crossbar letter (t) after a high exit: the pen is already at the bar's height, so the
    // connector runs on into the bar and the stem is a separate stroke across it.
    const bar = high ? crossbar(g) : null;
    // Some letters keep the end of their real lead-in (e keeps the rise that forms the bottom of
    // its eye) and the connector runs to where that part starts.
    const kept = high && g.hiLead > 0 ? strokeTail(last(g.lead), g.hiLead) : null;
    // Others have a variant drawn for this join: the o is Apple's own o from "bonjour", entered
    // at its top-left from a high link, so the connector never runs over where the o closes.
    const body = high && g.hiBody ? g.hiBody : g.body;
    const variant = body !== g.body;
    // r and s are entered right at their knot / peak, in the same stroke as the connector.
    const tight = high && g.hiTight;
    const atBody = variant || tight;
    const entry = kept ? startOf(kept) : atBody ? startOf(body[0]) : endOf(last(g.lead));
    const entryTangent = kept ? tangentOut(kept) : atBody ? tangentOut(body[0]) : tangentIn(last(g.lead));
    // Spacing is measured from where the previous letter's exit would be, tail included…
    // v and w exit further left than b's long link, so the o (entered at its top-left, as
    // after b in "bonjour") needs their extra room. An o adds its own room before any letter.
    const gap = (variant ? prev.gap : 0) + (high ? prev.room : 0);
    let ox = high ? prev.exit[0] - entry[0] + g.hi + gap : prev.exit[0] + RISE_GAP;
    let pen = prev;

    // …but a letter entered low doesn't want the previous letter's climb to x-height: cut it off.
    // The o's climb to x-height suits letters whose stroke starts at the top and goes down
    // (n m u i, as Apple's "bonjour" joins o → n, o → u); before anything else it is cut.
    const firstSeg = body[0][0];
    const startsDown = firstSeg[1][1] - firstSeg[0][1] < -Math.abs(firstSeg[1][0] - firstSeg[0][0]) * 0.5;
    if (high && pen.beforeTail && this.open && (bar || !(startsDown && !g.join))) {
      this.open.splice(this.open.length - pen.beforeTail.segs, pen.beforeTail.segs);
      pen = { ...pen, exit: pen.beforeTail.exit, tangent: pen.beforeTail.tangent, beforeTail: null };
    }
    // The link out of a high exit dips below the bar before climbing back to it; the bar is
    // reached by running level from where the stroke last was at its height instead.
    if (bar && this.open) {
      const barY = startOf(bar)[1];
      const dips = (seg: Segment) => seg[3][1] < barY - 20 || seg[2][1] < barY - 20;
      let popped = false;
      while (this.open.length > 1 && dips(last(this.open))) {
        this.open.pop();
        popped = true;
      }
      if (popped) pen = { ...pen, exit: endOf(this.open), tangent: tangentIn(this.open), linkCut: 0 };
    }
    // b's link is drawn to reach into a following bowl (a, o); before r and s it would leave a
    // long bare line, so it is cut short and the letter is spaced from where the pen now is.
    if (tight) {
      if (pen.linkCut && this.open) {
        const [link] = splitSegment(last(this.open), pen.linkCut);
        this.open.splice(-1, 1, link);
        pen = { ...pen, exit: link[3], tangent: tangentIn([link]), linkCut: 0 };
      }
      ox = pen.exit[0] - entry[0] + g.hi + prev.room;
      ox += apartShift(entry, ox, kept ? [kept, ...body] : body, this.strokes);
    }
    // Only letters entered low can be cut through this way; letters entered at the top keep
    // their spacing (fitted to Apple's own joins, e.g. "hola", "dobar").
    if (high && !g.tail && !bar && entry[1] < LOW_ENTRY_Y)
      ox += clearShift(pen.exit, pen.tangent, entry, entryTangent, ox, g, this.strokes);

    const barStart = bar ? translate(bar, ox) : null;
    const q: Point = barStart ? startOf(barStart) : [entry[0] + ox, entry[1], entry[2], entry[3]];
    const qTangent = barStart ? tangentOut(barStart) : entryTangent;
    if (q[0] - pen.exit[0] > MIN_CONNECTOR) {
      const segs = barStart
        ? dipToBar(pen.exit, q)
        : [connector(pen.exit, pen.tangent, q, qTangent, high ? HIGH_PULL : undefined)];
      const stroke = this.draw(segs);
      if (kept) stroke.push(...translate(kept, ox));
    } else {
      this.open = null;
    }
    if (!g.join && !atBody) this.open = null;
    if (barStart) {
      this.draw(barStart);
      this.open = null;
    }
    return { ox, lead: [], body };
  }
}

// Public API -----------------------------------------------------------------------------------

/** x/y bounds of all control points (an upper bound of the curve, as in SF-Hello's convert.py). */
export function bounds(strokes: readonly Stroke[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of strokes)
    for (const seg of s)
      for (const [x, y] of seg) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  return { minX, minY, maxX, maxY };
}

function composeWord(chars: string[]): { strokes: Stroke[]; marks: Stroke[] } {
  const writer = new WordWriter();
  for (const ch of chars) writer.write(GLYPHS[ch]);
  return writer.finish();
}

/** Composes a line of text into strokes. Unsupported characters are skipped and reported. */
export function compose(text: string): Composition {
  const strokes: Stroke[] = [];
  const kinds: StrokeKind[] = [];
  const skipped = new Set<string>();
  let cursor = 0;
  for (const word of text.toLowerCase().split(/\s+/)) {
    const chars = [...word].filter(c => {
      if (GLYPHS[c]) return true;
      skipped.add(c);
      return false;
    });
    if (!chars.length) continue;
    const { strokes: pen, marks } = composeWord(chars);
    const { minX, maxX } = bounds([...pen, ...marks]);
    const dx = cursor - minX;
    for (const s of pen) {
      strokes.push(translate(s, dx));
      kinds.push('pen');
    }
    for (const s of marks) {
      strokes.push(translate(s, dx));
      kinds.push('mark');
    }
    cursor += maxX - minX + WORD_GAP;
  }
  return { strokes, kinds, skipped: [...skipped] };
}
