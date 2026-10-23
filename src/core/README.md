# core

The engine, in plain TypeScript. Nothing here imports React, the DOM or three.js, because the same code runs on the main thread, inside the export worker and in Node tests. It may import `@/config` (plain data) and nothing else outside `core/`.

| Path       | Role                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| `types.ts` | `Point = [x, y, z, r]`, `Segment`, `Stroke`, `StrokeKind`. Read this first. |
| `glyphs/`  | Text → strokes: glyph data, `compose`, `weld`, join-quality checks          |
| `svg/`     | Strokes → SVG, stroke length and the draw timing every animation shares     |
| `print/`   | Strokes → print plan → watertight solid → 3MF/STL                           |

Units are glyph units (baseline 0, x-height ≈ 380, tube radius ≈ 30) until `print/csg` scales to millimetres.
