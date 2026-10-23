# Development

## Setup

Requires Node.js 20.19+ (see `.nvmrc`) and, only for regenerating glyphs, Python 3.

```bash
npm install
npm run dev
```

| Command          | Purpose                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `npm run dev`    | Vite dev server with hot reload (http://localhost:5173)                     |
| `npm run check`  | Typecheck, lint and test: run before every commit (CI runs it)              |
| `npm test`       | Vitest once; `npm run test:watch` to keep it running                        |
| `npm run format` | Prettier (`format:check` is what CI runs)                                   |
| `npm run build`  | Production build to `dist/`; `npm run preview` serves it                    |
| `npm run glyphs` | Regenerate `src/core/glyphs/glyph-data.json` from `scripts/build_glyphs.py` |

## Tests

Tests live in `tests/`, mirroring `src/core/`. They run in Node, which is one reason `core/` must stay free of React and the DOM.

| Suite                          | Guards                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `core/glyphs/compose.test.ts`  | Every letter composes; strokes are continuous; skipped characters; marks; SVG shape and escaping |
| `core/glyphs/joins.test.ts`    | Zero kinks and loose caps for every letter, all 676 pairs and a set of phrases                   |
| `core/glyphs/fidelity.test.ts` | Apple's own words stay within a mean distance of Apple's strokes                                 |
| `core/print/geometry.test.ts`  | Tubes are closed and outward-wound; draw-on progress is monotonic; radius scaling                |
| `core/print/plan.test.ts`      | Settings normalisation, width scaling, cut line, plate, feet, dot styles, warnings               |
| `core/print/formats.test.ts`   | CRC32, ZIP structure, STL size, 3MF content and escaping                                         |

The fidelity bounds sit just above today's values. If a change improves fidelity, lower the bound to lock it in; if it gets worse, the change is bending letters away from Apple's.

The CSG step (`core/print/csg/solid.ts`) needs WASM and isn't unit-tested. After changing it, export from the running app and check the status line: the expected size, number of feet and pieces.

## Recipes

### Tweak a letter's shape or spacing

1. Edit its entry in `scripts/build_glyphs.py` (`G['x'] = glyph(...)`). Segment indices refer to strokes in `data/source/hello-<lang>.json`.
2. Run `npm run glyphs`, then `npm test`. The joins and fidelity suites tell you if a join broke or a letter drifted.
3. Type words using the letter in the app and check them in both the 2D and the 3D preview.

Spacing after high exits is tuned by the per-glyph `hi`, `exitGap` and the constants in `core/glyphs/compose.constants.ts`. See [glyphs-and-composition.md](glyphs-and-composition.md).

### Add a character

Add a glyph entry in `build_glyphs.py` that follows the cut convention: start and end at a baseline minimum, or declare a `high` or `rise` exit. `SUPPORTED` and the skipped-character warning update automatically.

### Add a print option

1. Add the field to `PrintSettings` (`core/print/plan.types.ts`).
2. Add its default, its limits and its normalisation in `core/print/settings.ts` (`DEFAULT_PRINT`, `PRINT_LIMITS`, `normalizePrint`).
3. Use it in `printPlan` (`core/print/plan.ts`); the preview picks it up from the plan. If it changes the solid, use it in `core/print/csg/solid.ts` too.
4. Add a control in `features/print/panels/print-setup-panel/PrintSetupPanel.view.tsx`, built from `components/ui` primitives.
5. Add a test in `tests/core/print/plan.test.ts`.

### Add an export format

1. Write a pure writer in `core/print/formats/` that takes an `IndexedMesh` and returns a `Blob`.
2. Add the format to `ExportFormat` (`features/print/print.types.ts`), handle it in `features/print/hooks/use-print-export.ts`, and add a button in `PrintDownloadPanel.view.tsx`.
3. Add a test in `tests/core/print/formats.test.ts`.

### Add a component

Create a kebab-case folder with `index.tsx` (controller) or `index.ts` (re-export only), `Name.view.tsx` and `name.types.ts`. See the component convention in [architecture.md](architecture.md#component-convention). Use the theme tokens in `src/index.css` (`bg`, `surface`, `fg`, `fg-muted`, `fg-subtle`, `accent`, `success`, `warning`, `danger`); the UI is dark-only.

## Conventions

- TypeScript strict. Import across folders with the `@/` alias (`@/core/...`), within a folder with `./`.
- Comments explain _why_ (constraints, geometry conventions), not what the next line does. Each `core/` and `viewer/` file opens with a short header saying what it does.
- Tuning values go in `*.constants.ts`; user-facing limits in `LIMITS` / `PRINT_LIMITS`. No magic numbers in components.
- Expensive work runs once per change: the composition is memoised, the print plan only exists in the print workspace, the 3D preview gets a debounced plan, and the export runs in the worker.
- Don't call `setState` synchronously inside effects (the React Hooks lint rules check this).
- Prettier: single quotes, width 110.
