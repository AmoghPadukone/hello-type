import type { Point, Stroke, StrokeKind } from '@/core/types';

/** The result of composing a line of text. `kinds[i]` says what `strokes[i]` is. */
export interface Composition {
  strokes: Stroke[];
  kinds: StrokeKind[];
  /** Characters with no glyph, in first-seen order. */
  skipped: string[];
}

/** How the pen leaves a glyph: at a baseline minimum, high at x-height (o b v w), or rising out of a descender loop. */
export type ExitType = 'low' | 'high' | 'rise';

/** One glyph as produced by scripts/build_glyphs.py. Entry is at x = 0. */
export interface Glyph {
  /** Strokes carrying the pen in from the previous letter's baseline exit. */
  lead: Stroke[];
  /** The lead's last stroke flows straight into body[0]. */
  join: boolean;
  /** The lead is a detached tail stroke (bowl letters); dropped when the letter starts a word. */
  tail: boolean;
  body: Stroke[];
  marks: Stroke[];
  exit: Point;
  exitType: ExitType;
  /** The exit is not the end of the last body stroke, so the next letter starts a new stroke. */
  detached: boolean;
  /** Lead used when the letter starts a word, if different. */
  initial: Stroke[] | null;
  /** x nudge used after a high exit. */
  hi: number;
  /** The last body segments are a rising tail, dropped when the next letter is entered low. */
  tailSegs: number;
  /** After a high exit, keep this share of the end of the lead-in (0 = replace it). */
  hiLead: number;
  /** After a high exit, draw this body instead (its start is the entry, its end the exit). */
  hiBody: Stroke[] | null;
  /** Extra room after this letter's high exit, whatever follows. */
  exitGap: number;
  /**
   * After a high exit, enter at the start of the body (r's knot, s's peak) in one stroke, placed
   * as close as the previous letter allows, through its shortened link (linkCut).
   */
  hiTight: boolean;
  /** Share of this letter's high link kept before a hiTight letter (0 = keep it all). */
  linkCut: number;
  /** Extra room after this letter's high exit before any letter (o's link otherwise crowds "og"). */
  exitRoom: number;
}

/** Shape of glyph-data.json. `flick` is the word-final stroke added after a low exit. */
export interface GlyphData {
  glyphs: Record<string, Glyph>;
  flick: Stroke;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
