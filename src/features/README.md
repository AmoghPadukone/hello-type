# features

One folder per part of the product. Features don't import each other; shared pieces go to `components/`, `hooks/`, `utils/` or `settings/`.

| Feature       | What it is                                                                             |
| ------------- | -------------------------------------------------------------------------------------- |
| `text-input/` | The text box, with a placeholder that cycles through examples                          |
| `graphic/`    | 2D workspace: animated preview, appearance panel, SVG / animated SVG / PNG downloads   |
| `print/`      | 3D workspace: 3D preview, print setup, dot styles, 3MF / STL export through the worker |

Each component is a folder: `index.tsx` (controller: hooks and handlers) renders `Name.view.tsx` (JSX only), with props in `name.types.ts`. A feature's own hooks are in its `hooks/` folder, shared types in `<feature>.types.ts`.

Each workspace ends in one primary download, repeated in a sticky bar on mobile (`MobileCTA`). Keep new controls inside the workspace they serve.
