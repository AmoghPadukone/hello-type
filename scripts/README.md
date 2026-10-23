# scripts

`build_glyphs.py` builds `src/core/glyphs/glyph-data.json` from Apple's words in `data/source/`. It uses Python 3's standard library only.

```bash
npm run glyphs
```

The module docstring explains the build step by step, and the file reads top to bottom in the same order: geometry helpers, the `Glyph` dataclass (which documents every field and mirrors `glyph.types.ts`), shared pieces, the alphabet, shared metrics, output. Each letter is a `G['x'] = glyph(...)` entry, in a–z order, with a comment naming its source word and any hand-drawn parts. After editing, run `npm test`. See [docs/glyphs-and-composition.md](../docs/glyphs-and-composition.md).
