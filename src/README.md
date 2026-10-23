# src

The app. Start at `main.tsx` → `app/index.tsx`. For the big picture, read [docs/architecture.md](../docs/architecture.md).

| Folder        | What's in it                                                            |
| ------------- | ----------------------------------------------------------------------- |
| `app/`        | Root controller, page layout, providers                                 |
| `features/`   | The text box and the two workspaces: `graphic/` (2D) and `print/` (3D)  |
| `components/` | Shared UI: `ui/` primitives, `layout/` page chrome, `script-word/`      |
| `hooks/`      | Hooks both workspaces use                                               |
| `settings/`   | The settings model: types, defaults, limits, normalisation, persistence |
| `utils/`      | Small helpers: downloads, PNG rendering, file names, `cn`               |
| `config/`     | Brand copy and app-wide constants                                       |
| `core/`       | Pure engine: lettering, SVG, print plan, meshing, CSG, file formats     |
| `viewer/`     | three.js 3D preview                                                     |

Imports only point down the list: `app → features → components/hooks/settings/utils/config → core`. `npm run lint` enforces this.
