# Architecture

Hellotype is a static single-page app (Vite, React 19, TypeScript, Tailwind 4). There is no backend: composition, meshing and CSG all run in the browser, with the CSG in a Web Worker.

## Data flow

Data flows one way through pure functions. Only `viewer/`, the worker client and the React layer touch the DOM.

```
                     text
                       │  compose()                       core/glyphs
                       ▼
        strokes [x, y, z, r] + kinds (pen | mark)
          │                                │
          │ toSVG()                        │ printPlan()           core/print
          ▼                                ▼
   2D preview, SVG, PNG              PrintPlan ─────────────┐
   (features/graphic)                  │                    │
                                       │ (debounced)        │ buildSolidInWorker()
                                       ▼                    ▼
                                 Viewer (three.js)     worker: manifold-3d
                                 viewer/               core/print/csg
                                                            │
                                                            ▼
                                                     3MF / STL  core/print/formats
```

The 3D side is described step by step in [3d-pipeline.md](3d-pipeline.md); the lettering side in [glyphs-and-composition.md](glyphs-and-composition.md).

## Folders

```
src/
  main.tsx            entry: providers + <App />
  app/                app shell: root controller, page layout, providers
  config/             brand copy and app-wide constants (plain data)
  settings/           settings model: types, defaults, limits, normalisation, storage, useSettings
  hooks/              hooks shared by both workspaces (composed text, replay token, debounce)
  utils/              small DOM/format helpers (download, PNG, slug, cn)
  components/
    ui/               design-system primitives (Radix + Tailwind)
    layout/           page chrome: Nav, Hero, ModeTabs, Footer, PreviewCard, MobileCTA, EmptyState
    script-word/      a word drawn inline in the app's own script
  features/
    text-input/       the text box
    graphic/          2D workspace: preview, appearance, SVG/PNG export
    print/            3D workspace: preview, print setup, dot styles, 3MF/STL export
  core/               pure TypeScript, no React or DOM (runs in the worker and in Node tests)
    types.ts          Point, Segment, Stroke, StrokeKind
    glyphs/           glyph data, compose, weld, join-quality checks
    svg/              strokes → SVG, stroke length and draw timing
    print/            print plan, settings, estimate, dots, geometry, csg (worker), formats
  viewer/             three.js preview (lazy-loaded)
tests/                Vitest suites, mirroring src/core
scripts/              build_glyphs.py
data/source/          Apple's source words (input to the glyph build)
```

## Dependency rules

```
app ──▶ features ──▶ components · hooks · settings · utils · config ──▶ core
                                                        viewer ──▶ core
```

- `core/` imports only `core/` and `config/`. It never imports React, the DOM, three.js or the UI layers.
- Features don't import each other. Anything two features share goes into `components/`, `hooks/`, `utils/` or `settings/`.
- `viewer/` is only loaded through the dynamic import in `features/print/hooks/use-viewer.ts`, so three.js stays a separate chunk. Elsewhere it may be imported as a type only.

These rules are enforced by `no-restricted-imports` zones in `eslint.config.js`, so `npm run lint` fails on a violation.

## Component convention

Every component lives in its own kebab-case folder. The `.view.tsx` file is PascalCase; the `.ts` files are kebab-case:

```
print-workspace/
  index.tsx                 controller: hooks, state, derived data, handlers → renders the view
  PrintWorkspace.view.tsx   JSX only: props in, callbacks out; no state or effects
  print-workspace.types.ts   props (and view props)
  print-workspace.constants.ts   optional: data tables used by the view (icons, swatches, sketches)
```

- A component with no logic has an `index.ts` that only re-exports its view.
- A view may receive a ref as a prop (`hostRef`) when the controller needs the DOM node.
- Sub-views that belong to one component live in its folder (`ExportPanel/ExportRow.view.tsx`, `DotPicker/DotIcon.view.tsx`).
- Hooks a feature owns live in `features/<feature>/hooks/`; shared hooks in `src/hooks/`.

Non-component modules follow the same idea: `name.ts` for the logic, `name.types.ts` for the types it exports and `name.constants.ts` for tuning values. Types used only inside one file stay in that file.

## State and settings

All user settings are one `Settings` object (`settings/settings.types.ts`), owned by `useSettings` in the root controller.

```
localStorage ─┐
?text=        ├─▶ loadSettings() ─▶ normalizeSettings() ─▶ state ─▶ update(patch) ─▶ normalizeSettings()
#graphic|#print┘                                             │
                                                             ├─▶ URL hash (#graphic / #print)
                                                             └─▶ localStorage (debounced 300 ms)
```

- Every value from storage, the URL or a control goes through `normalizeSettings` / `normalizePrint`, which clamp to `LIMITS` / `PRINT_LIMITS`.
- `update` merges `print` patches into the current print settings.
- A shared `?text=` link is applied once and then removed from the URL.

## What computes where

| Work                    | Where                              | When                                    |
| ----------------------- | ---------------------------------- | --------------------------------------- |
| `compose`, lengths, SVG | `useComposedText` (app controller) | When the text, colour or weight changes |
| Print plan              | `usePrintPlan` (print workspace)   | Only while the print workspace is open  |
| 3D preview mesh         | `Viewer.setPlan`, main thread      | On a debounced plan (120 ms)            |
| CSG solid               | Web Worker                         | Only when the user exports              |

## Build and deploy

`npm run build` type-checks and emits a static site in `dist/` with relative asset paths (`base: './'`), so it works from any sub-path. The worker, the manifold WASM and three.js are separate chunks.

CI (`.github/workflows/ci.yml`) runs `npm run check`, `npm run format:check` and `npm run build` on every push and pull request. `.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages on every push to `main`. To enable it, set **Settings → Pages → Source** to **GitHub Actions**.
