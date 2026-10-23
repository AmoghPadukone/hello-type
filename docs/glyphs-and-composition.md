# Glyphs and composition

How Apple's "hello" words become a 26-letter alphabet, and how letters are chained into words.

```
data/source/hello-*.json     Apple's words: cubic Béziers over [x, y, z, r] points
        │  scripts/build_glyphs.py   (Python 3, stdlib only: npm run glyphs)
        ▼
src/core/glyphs/glyph-data.json   26 glyphs + the word-final flick (generated, never hand-edit)
        │  compose(text)             (src/core/glyphs/compose.ts)
        ▼
{ strokes, kinds, skipped }      pen strokes, then marks (dots, crossbars)
```

## Units and points

Glyph units, y up: baseline 0, x-height ≈ 380, ascender ≈ 737, descender ≈ −330, tube radius ≈ 30. A point is `[x, y, z, r]`: `z` is depth (upstrokes behind, downstrokes in front) and `r` is the tube radius. Keep `z` and `r` continuous whenever strokes are joined or snapped; a jump shows as a step in the 3D tube.

## Building the glyphs

`scripts/build_glyphs.py` cuts letters out of the Latin-script source words (`ref(lang, stroke, a, b)` takes segments `a..b` of one stroke). Letters the words don't contain (f g k p q v w y) are assembled from pieces of the others, plus a few hand-drawn segments with matching tangents. Hand-drawn depth follows Apple's rule: rising strokes behind, falling strokes in front (`shade`).

Each letter's source and any hand-made parts are commented at its `G['x'] = glyph(...)` entry.

Two passes run after the letters are defined:

- **Shared metrics.** Apple's words are drawn separately, so the same letter's height drifts between them. Every glyph is remapped (piecewise-linear in y, baseline fixed) to one x-height, ascender and descender, like a typeface.
- **Rounding** to 0.1 units, then writing `glyph-data.json`.

## The cut convention

Every glyph is cut at **baseline minima**, where the pen bottoms out with a horizontal tangent. Every glyph therefore starts and ends at the same height and direction, so glyphs chain by translation alone.

A glyph (`core/glyphs/glyph.types.ts`) has:

| Field              | Meaning                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `lead`             | How the pen arrives from the previous letter.                                                |
| `body`             | The letter itself.                                                                           |
| `marks`            | Dots and crossbars, drawn after the word.                                                    |
| `exit`, `exitType` | Where the pen leaves: `low` (baseline), `high` (x-height: o b v w) or `rise` (descenders).   |
| `join`             | The lead flows straight into the body in one stroke.                                         |
| `tail`             | The lead is a detached tail (bowl letters a c d g q); dropped when the letter starts a word. |
| `initial`          | A different lead for the start of a word (h, k, m).                                          |

The remaining fields only matter after a high exit (below).

## Composing a word

`compose(text)` lowercases the text, splits it into words and skips unsupported characters (reported in `skipped`). `composeWord` then places letters left to right.

**After a low exit**, the next letter is translated so its lead starts at the pen. `snapStart` moves the lead's first point exactly onto the previous exit (easing depth and radius over the first segment), and the lead is appended to the open stroke.

**After a high or rising exit**, the next letter's lead is dropped and a generated cubic **connector** runs from the exit to the letter's entry. The connector's handles follow the exit and entry tangents (`HIGH_PULL` makes it glide out flat and turn up late). Per-glyph options shape these joins:

| Option     | Used by | Effect                                                                                                                 |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `hi`       | all     | Spacing nudge after a high exit, fitted against Apple's words (e.g. `o.hi = 0` matches "bonjour").                     |
| `tailSegs` | o       | The o's rising tail is kept only before letters whose stroke starts at the top and goes down (n m u i), cut otherwise. |
| `hiBody`   | o       | After b/o/v/w, the o is Apple's own o from "bonjour", entered at its top-left.                                         |
| `exitGap`  | v w s   | Extra room after this letter (v/w exit further left than b's long link; s's curl would fuse with a following bowl).    |
| `hiLead`   | e r     | Keep this share of the real lead-in (e keeps the rise that forms its eye's bottom; r keeps the top of its knot).       |
| `hiTight`  | r s     | Join in one stroke right at the knot (r) or peak (s), placed as close as the previous letter allows (`apartShift`).    |
| `linkCut`  | b       | Before a `hiTight` letter, shorten b's link (drawn to reach into a following bowl) to this share.                      |

A letter entered low after a high exit is placed by `clearShift`: the tightest position where the letter doesn't overlap the previous one and the connector doesn't cut through the part of the letter above its entry (e's eye).

A crossbar letter (t) after a high exit is entered along its bar: the connector dips gently (`dipToBar`) and runs into the bar.

**Word ends.** After a low exit the word-final flick is added; after a rising exit a short tail carries the stroke clear of the stem. Words are laid out `WORD_GAP` apart. All spacing values live in `compose.constants.ts`.

<a id="weld"></a>

## Weld: making joins exact

In 2D, strokes that almost meet still look joined because they overlap. As 3D tubes every round end cap shows. `weld` finishes each word: any stroke end within `JOIN_REACH` (2.4) tube radii of another stroke is moved onto that stroke's centreline, taking its depth and at most its radius. Ends are welded one at a time, against the current geometry, and the pass repeats until nothing moves.

Glyph designs also avoid pen lifts where a stroke should continue (b's `bow_link`, v/w's `vw_finish`, s's turn into its exit), because a lift leaves a cap that welding can't hide.

## Quality checks

`core/glyphs/quality.ts` finds two defects:

- **kink**: a direction change of 20°–55° between two segments of one stroke, which shows as a crease. Sharper turns are deliberate elbows; the tube builder splits there.
- **loose cap**: a stroke end close to another stroke (under `JOIN_REACH` radii) that doesn't end inside it (more than 0.35 radii from its centreline).

`tests/core/glyphs/joins.test.ts` requires zero issues for every letter alone, all 676 letter pairs and a set of phrases. `tests/core/glyphs/fidelity.test.ts` composes Apple's own words ("merhaba", "bonjour", "hello" …) and requires the mean distance to Apple's strokes to stay under fixed bounds, so changes that bend letters or spacing away from Apple's fail.
