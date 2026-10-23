/**
 * Spacing and join tuning for compose.ts, in glyph units unless noted. Most values were fitted
 * against Apple's own words with the fidelity test (tests/core/glyphs/fidelity.test.ts), so
 * check it after changing any of them.
 */

/** Space between words. */
export const WORD_GAP = 420;
/** Length of the tail added after a word-final descender exit (g j y f q). */
export const TAIL_LENGTH = 130;
/** Space after a descender's rising exit. */
export const RISE_GAP = 150;
/** Connectors shorter than this (in x) are skipped: the next letter already starts at the pen. */
export const MIN_CONNECTOR = 30;

/** Handle weights after a high exit: a long leaving handle glides flat, a short arriving one turns up late. */
export const HIGH_PULL = [0.5, 0.6];

/**
 * After a high exit the connector must not cut through the letter it runs into (e's eye is
 * entered at its bottom-right, so a short connector would slice its left wall). The letter is
 * nudged right in steps until the connector stays this many tube widths clear of its strokes.
 */
export const CLEARANCE = 0.6;
export const CLEAR_STEP = 20;
export const CLEAR_MAX = 400;
/** Minimum distance between the letter and the one before it, in tube widths. */
export const LETTER_GAP = 1.15;
/** Height above the entry point where the protected part of the letter begins. */
export const EYE_MARGIN = 40;

/** Body points this many tube widths from the entry may touch the previous letter: they join it. */
export const ENTRY_REACH = 2;
/**
 * A hiTight letter sits right beside the previous one with no lead-in between them, so it needs
 * more room than LETTER_GAP (s's curl would otherwise press into b's bowl).
 */
export const TIGHT_GAP = 1.8;

/** After a high exit, an entry below this height drops the previous letter's rising tail. */
export const LOW_ENTRY_Y = 300;

/** Depth of the gentle dip the pen makes between the previous letter and a crossbar. */
export const BAR_DIP = 70;
