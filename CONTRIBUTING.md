# Contributing

Thanks for helping out! Bug reports, letter fixes, new print options and docs improvements are all welcome.

## Getting set up

```bash
npm install
npm run dev        # http://localhost:5173
```

Node.js 20.19+ is required (see `.nvmrc`). Python 3 is only needed to regenerate glyphs.

Before you start, skim [docs/architecture.md](docs/architecture.md) for the folder layout and the rules for what may import what. Every source folder also has a short `README.md`.

## Making a change

1. Branch from `main`.
2. Keep to the structure:
   - `src/core/` stays pure TypeScript (no React, DOM or three.js).
   - Features don't import each other.
   - Components follow the folder convention: `index.tsx` controller, `Name.view.tsx`, `name.types.ts`.
   - Tuning values go in `*.constants.ts`, user-facing limits in `LIMITS` / `PRINT_LIMITS`.
3. Never hand-edit `src/core/glyphs/glyph-data.json`. Edit `scripts/build_glyphs.py` and run `npm run glyphs`.
4. Add or update tests in `tests/` for anything in `src/core/`.
5. Run `npm run check` (typecheck, lint, tests) and `npm run format`.

Step-by-step recipes (tweak a letter, add a print option, add an export format) are in [docs/development.md](docs/development.md#recipes).

## Pull requests

- Keep each PR to one change and explain why it's needed.
- For visual changes (letters, joins, the 3D preview, UI), include before/after screenshots.
- If you changed the CSG step (`src/core/print/csg/`), say what the export status line reported (size, feet, pieces).
- Update the docs (`docs/`, folder READMEs, `AGENTS.md`) when you change how something works.

## Licence

By contributing you agree that your code is released under the [MIT licence](LICENSE). Don't add proprietary assets; the Apple stroke data in `data/source/` is the one exception and is not covered by the MIT licence.
