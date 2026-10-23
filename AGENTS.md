# AGENTS.md

Instructions for AI coding agents (and a quick start for humans). Read this before changing code. Deeper explanations are in [`docs/`](docs/) and in the `README.md` inside each source folder; this file links to them rather than repeating them.

## What this is

**Hellotype** is a static web app (Vite, React 19, TypeScript strict, Tailwind 4, no backend). You type lowercase text and it is written in Apple's cursive "hello" script. It exports:

- 2D: SVG, a self-animating SVG, and PNG.
- 3D: a watertight 3MF/STL. A round tube is swept along the pen path using Apple's front/back depth, then optionally cut flat to stand upright, placed on a base plate, or laid flat. The CSG runs in a Web Worker (manifold-3d).

## Hard rules

1. **Run `npm run check` before you finish** (typecheck, lint, tests). Run `npm run format` too; CI also runs `format:check` and `build`.
2. **Never hand-edit `src/core/glyphs/glyph-data.json`.** Change `scripts/build_glyphs.py`, then run `npm run glyphs` and `npm test`.
3. **`src/core/` stays pure:** no React, DOM or three.js imports. It runs in the worker and in Node tests. It may import `@/config` and nothing else outside `core/`.
4. **Respect the import direction:** `app → features → components / hooks / settings / utils / config → core`, plus `viewer → core`. Features never import each other. `@/viewer/*` is imported only as a type outside `viewer/` (it is loaded with a dynamic import in `features/print/hooks/use-viewer.ts`). ESLint enforces all of this.
5. **Tubes stay watertight.** Every tube from `core/print/geometry/tube.ts` must be closed and outward-wound. Frames are computed once per piece, never per export chunk.
6. **Joins stay exact.** All 676 letter pairs must have zero kinks and loose caps (`tests/core/glyphs/joins.test.ts`). Fidelity bounds must not be loosened to make a change pass.
7. **Untrusted settings go through `normalizeSettings` / `normalizePrint`.** Ranges live in `LIMITS` / `PRINT_LIMITS`; no magic numbers in components.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + tests
npm run format       # Prettier (single quotes, width 110)
npm run build        # production build to dist/
npm run glyphs       # regenerate glyph-data.json (Python 3, stdlib only)
```

## Map

```
src/
  main.tsx  app/                 entry, root controller, layout, providers
  config/                        brand.ts (all product copy), constants.ts (timings, keys, sizes)
  settings/                      Settings type, defaults, LIMITS, normalizeSettings, storage, useSettings
  hooks/                         useComposedText, useReplay, useDebouncedValue
  utils/                         downloadBlob, svgToPng, slug, formatMM, cn
  components/ui/                 primitives: Button ColorPicker Field Panel Segmented Slider Switch Tooltip
  components/layout/             Nav Hero ModeTabs Footer PreviewCard MobileCTA EmptyState
  components/script-word/         inline word drawn in the app's own script
  features/text-input/           TextBar
  features/graphic/              2D workspace, Preview2D, AppearancePanel, ExportPanel, useGraphicExports
  features/print/                3D workspace, Preview3D, DotPicker, panels/, usePrintPlan, usePrintExport, useViewer
  core/types.ts                  Point = [x, y, z, r], Segment, Stroke, StrokeKind  ← read first
  core/bezier.ts                 bezierPoint, unit, direction (shared cubic maths)
  core/glyphs/                   glyph-data.json, compose (+ weld), quality checks
  core/svg/                      toSVG, strokeLength, strokeDuration
  core/print/                    plan, settings, estimate, dots/, geometry/ (tube), csg/ (worker), formats/
  viewer/                        three.js Viewer (lazy-loaded)
tests/core/                      mirrors src/core
scripts/build_glyphs.py          data/source/*.json → glyph-data.json
docs/                            architecture, 3d-pipeline, glyphs-and-composition, development
```

## Component and module convention

```
name/
  index.tsx           controller: hooks, state, derived data, handlers → <NameView … />
  Name.view.tsx       JSX only: props in, callbacks out; no state or effects (a ref may come in as a prop)
  name.types.ts       NameProps (and NameViewProps)
  name.constants.ts   optional data tables (icons, swatches, sketches)
```

A component without logic has `index.ts` that only re-exports its view. Sub-views stay in the component's folder. A feature's hooks go in `features/<feature>/hooks/`. Non-component modules use `name.ts`, `name.types.ts` (exported types) and `name.constants.ts` (tuning). Use `@/` for imports across folders and `./` within one.

Copy this when adding a component with logic:

```tsx
// Foo/foo.types.ts
export interface FooProps {
  value: string;
  onChange: (v: string) => void;
}
export interface FooViewProps extends FooProps {
  derived: number;
}

// foo/Foo.view.tsx
import type { FooViewProps } from './Foo.types';
export function FooView({ value, derived, onChange }: FooViewProps) {
  return (
    <div>
      {value}
      {derived}
    </div>
  );
}

// foo/index.tsx
import { useMemo } from 'react';
import type { FooProps } from './Foo.types';
import { FooView } from './Foo.view';
export function Foo(props: FooProps) {
  const derived = useMemo(() => props.value.length, [props.value]);
  return <FooView {...props} derived={derived} />;
}
```

## Task → files → checks

| Task                                   | Touch                                                                                                                | Verify                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Change a letter's shape or spacing     | `scripts/build_glyphs.py` (`G['x'] = glyph(...)`), maybe `core/glyphs/compose.constants.ts`                          | `npm run glyphs`, `npm test` (joins + fidelity), look in app |
| Add a character                        | `scripts/build_glyphs.py` (follow the cut convention)                                                                | `npm run glyphs`, `npm test`                                 |
| Change how letters join                | `core/glyphs/compose.ts`                                                                                             | `npm test` (joins + fidelity)                                |
| Add a print option                     | `core/print/plan.types.ts`, `core/print/settings.ts`, `core/print/plan.ts`, `PrintSetupPanel.view.tsx`, test         | `tests/core/print/plan.test.ts`, export in app               |
| Change the solid (sockets, plate, CSG) | `core/print/csg/solid.ts`                                                                                            | Export in app: status line shows expected size, feet, pieces |
| Change tube meshing                    | `core/print/geometry/tube.ts`, `tube.constants.ts`                                                                   | `tests/core/print/geometry.test.ts`                          |
| Add a dot style                        | `core/print/dots/` (types, constants, `styleStrokes`), `features/print/dot-picker/DotIcon.view.tsx`                  | `tests/core/print/plan.test.ts`                              |
| Add an export format                   | `core/print/formats/<fmt>.ts`, `features/print/print.types.ts`, `use-print-export.ts`, `PrintDownloadPanel.view.tsx` | `tests/core/print/formats.test.ts`                           |
| Change the 3D preview's look           | `viewer/viewer.constants.ts`, `viewer/viewer.ts`                                                                     | Look in app                                                  |
| Change copy, credits, examples         | `config/brand.ts`                                                                                                    | Look in app                                                  |
| Add a shared setting                   | `settings/settings.types.ts`, `defaults.ts`, `limits.ts`, `normalize.ts`                                             | `npm run check`                                              |
| New UI control                         | Build from `components/ui`; colours from tokens in `src/index.css`                                                   | Look in app (dark theme only)                                |

## Domain facts that are easy to get wrong

- **Units.** Glyph units, y up: baseline 0, x-height ≈ 380, ascender ≈ 737, descender ≈ −330, tube radius ≈ 30 (stroke width 60). Print output is millimetres with z up and the bed at z = 0.
- **Points are `[x, y, z, r]`.** `z` is Apple's depth (upstrokes ≈ −30 behind, downstrokes ≈ +50 in front) so loops pass each other in 3D; `r` is the tube radius. 2D code uses x/y only. Keep z and r continuous when joining or snapping strokes (`snapStart` in compose, `snap` in the Python build).
- **Glyph cut convention.** Glyphs are cut at baseline minima, so they chain by translation. `lead` (how the pen arrives), `body`, `marks` (dots, crossbars, drawn after the word), `exit` + `exitType` (`low` continues into the next lead; `high` for o b v w and `rise` for descenders get a generated connector). Per-glyph options for high joins (`hi`, `tailSegs`, `hiBody`, `exitGap`, `hiLead`, `hiTight`, `linkCut`) are explained in [docs/glyphs-and-composition.md](docs/glyphs-and-composition.md). `tail` leads (a c d g q) are dropped word-initially.
- **Weld.** `compose` ends each word with `weld`, which moves stroke ends within `JOIN_REACH` (2.4) tube radii of another stroke onto its centreline. Glyph designs avoid pen lifts where a stroke should continue. Turns sharper than 55° are deliberate elbows.
- **Marks in print.** `applyDots` applies the chosen `DotStyle` to every zero-length mark. Connected styles add strokes so the dot touches the word; `pin` moves the dot to `plan.previewOnly` + `plan.pins` and `solid.ts` drills a socket and lays a pegged dot beside the word. Crossbars are nudged until they overlap. The 2D output is untouched.
- **Standing prints.** `footY` is the lowest pen _local minimum_ above the descender zone, so strokes passing through the baseline don't count as feet. Without a plate the cut is at `footY + feetMM`, or `lowY + feetMM` when there are descenders, so the word stands on its loops (kept whole) and the other letters hang above. With a plate the slab's top sits at that line and the cut moves to the slab's underside, so words join. The solid is then rotated +90° about x so glyph y becomes print z.
- **One plan, two consumers.** The preview and the export both read the same `PrintPlan`; never compute print geometry separately for one of them.
- Full 3D walkthrough: [docs/3d-pipeline.md](docs/3d-pipeline.md).

## Gotchas

- Keep the worker import exactly as `new Worker(new URL('./solid.worker.ts', import.meta.url), { type: 'module' })`; Vite only bundles it in that form. `?url` imports are Vite-only too.
- three.js is code-split. Never import `@/viewer/viewer` as a value outside `viewer/`.
- Zero-length strokes (i/j dots) can't be dash-animated; they pop in on cue (`DOT_LENGTH` in `core/svg/svg.ts`).
- The CSG step needs WASM and isn't unit-tested. After changing `core/print/csg/`, export from the running app and check the status line.
- Expensive work runs once per change: composition is memoised in `useComposedText`, the print plan only exists while the print workspace is mounted, the 3D preview gets a debounced plan, and export runs in the worker. Don't call `setState` synchronously in effects.
- `Viewer` owns all GPU resources; always `dispose()` it. Colour updates never rebuild geometry.
- `data/source/` and `glyph-data.json` are Apple's copyrighted data, excluded from the MIT licence. Don't add other proprietary assets.
- Comments explain _why_ (constraints, geometry conventions), not what the next line does. Every `core/` and `viewer/` file opens with a short header.

## Read next

- [docs/architecture.md](docs/architecture.md): data flow, folders, dependency rules, state, what computes where.
- [docs/3d-pipeline.md](docs/3d-pipeline.md): strokes → tubes → solid → file, and the live preview.
- [docs/glyphs-and-composition.md](docs/glyphs-and-composition.md): the glyph build, joins, weld, quality checks.
- [docs/development.md](docs/development.md): tests, recipes, conventions.
