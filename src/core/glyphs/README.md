# core/glyphs

Turns text into pen strokes.

- `glyph-data.json`: the 26 glyphs. **Generated** by `scripts/build_glyphs.py` (`npm run glyphs`); never edit it by hand.
- `compose.ts`: `compose(text)` → `{ strokes, kinds, skipped }`. Chains letters, generates connectors after high and rising exits, and finishes every word with `weld` so joins are exact in 3D.
- `compose.constants.ts`: spacing and join tuning, fitted against Apple's own words.
- `quality.ts`: finds kinks and loose caps; used by `weld` and by `tests/core/glyphs/joins.test.ts`.
- `glyph.types.ts`, `quality.types.ts`: the glyph record and check results.

How it works: [docs/glyphs-and-composition.md](../../../docs/glyphs-and-composition.md).
