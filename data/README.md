# data

`source/hello-<lang>.json` is Apple's "hello" in 22 Latin-script languages, from [SF-Hello](https://github.com/JaceThings/SF-Hello). Each file holds a list of `strokes`. Each stroke is a list of cubic segments `{ p0, p1, p2, p3 }`, and each point starts with `[x, y, z, r]` (position, depth and tube radius).

These files are the input to `scripts/build_glyphs.py` and to the fidelity test.

**Licence:** the stroke data is © Apple Inc. It is **not** covered by this repository's MIT licence, and neither is the generated `src/core/glyphs/glyph-data.json`. It is included, as in SF-Hello, for non-commercial, fan and educational use.
