# Hellotype

**Your words, in the script that said hello.** Type anything and watch it write itself in the cursive “hello” that Susan Kare drew for the original Macintosh in 1984. Then download a crisp SVG or a print-ready 3D model for your desk.

- ✍️ **Any lowercase word.** A full a–z cursive alphabet: 18 letters are cut from Apple's own pen strokes, and the rest are assembled from those strokes in the same style.
- 🎞️ **Draw-on animation** that matches Apple's pacing, in the app and in a self-animating SVG export.
- 🧊 **A real 3D tube, not an extruded outline.** A round tube is swept along the pen path using Apple's own depth data, so loops pass in front of and behind each other the way they do in the macOS 3D "hello".
- 🖨️ **Print-ready export.** A single watertight solid as 3MF or STL, sized in millimetres. It can stand upright on flat feet or a base plate, or lie flat.

> The original “hello” was drawn by **Susan Kare** for the Macintosh (1984). The lettering and stroke data are © Apple Inc. This project is a tribute and is not affiliated with or endorsed by Apple. See [Credits](#credits).

## Quick start

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # static site in dist/ (works from any sub-path, e.g. GitHub Pages)
npm run preview    # serve the production build
```

## Using it

Type in the text bar, or tap an example. Lowercase a–z and spaces are supported; anything else is skipped and listed under the bar. Then pick what you're making. The choice is remembered and kept in the URL (`#graphic` / `#print`), so you can link straight to either workspace.

### Graphic (SVG · PNG)

A large 2D preview with **Appearance** (colour, stroke weight, drawing speed) and **Download**: SVG, an animated SVG that draws itself when opened in a browser, or a transparent PNG.

### 3D print (3MF · STL)

A large 3D preview (drag to rotate) that shows exactly what will be exported.

| Setting         | What it does                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Standing        | Exported upright. The bottom is sliced flat along the baseline (**Feet cut**), so every letter touching the desk gets a flat foot.       |
| Base plate      | Every word stands on a rounded slab at the baseline, joining multiple words into one piece. Descender loops (g j p q y f) sink into it.  |
| Lying flat      | Exported on its back. **Flatten back** shaves it flat so it prints without supports.                                                     |
| Thickness       | Tube thickness relative to Apple's (1.3× by default for sturdier prints).                                                                |
| Depth           | How far loops swing in front of and behind each other. 100% is Apple's; lower values fuse crossings into a stronger, more compact piece. |
| Dots on i and j | Appears when your text has an i or j. Pick how Apple's floating dots print (see below).                                                  |

**Dot styles.** Apple's i/j dots float above their stems, so on their own they'd print as loose pieces.

| Style        | Result                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Teardrop     | The stem flicks up and swells into the dot (default).                                                  |
| Curl         | The stem winds into a small spiral.                                                                    |
| Swash        | The dot stays put, joined by a wavy thread.                                                            |
| Loop         | A small pen loop above the stem stands in for the dot.                                                 |
| Tether       | The dot stays put, joined by a straight fine rod.                                                      |
| Back rod     | Looks original from the front; a rod joins the dot from behind.                                        |
| Accent       | The dot becomes a short slanted stroke on the stem.                                                    |
| Bead         | The dot drops onto the stem top. Strongest.                                                            |
| Pin & socket | Exact original: the dot prints beside the word with a peg, and the stem gets a socket to glue it into. |
| Floating     | Exactly as designed; the dot prints as a loose piece.                                                  |

The panel estimates the finished size and warns about problems: thin tubes, descenders trimmed by flat feet, tip-over risk. Once the export finishes, it shows the real size, how many feet the model stands on, and the volume.

**Printing tips:** standing pieces print upright and need supports under the loops (tree supports work well). Use 3MF if your slicer supports it: it keeps units and topology. For short words, 120 mm or wider and Thickness ≥ 1.3× gives a sturdy piece.

## How it works

```
data/source/*.json ──scripts/build_glyphs.py──▶ src/core/glyphs/glyph-data.json
                                                   │
 text ──▶ compose() ──▶ strokes [x, y, z, r] ──┬──▶ toSVG()            2D preview, SVG / PNG
                                                ├──▶ printPlan() ──▶ Viewer          3D preview (three.js)
                                                └──▶ printPlan() ──▶ buildSolid()    Web Worker + manifold-3d
                                                                       └──▶ 3MF / STL
```

- **The source data.** Apple's “hello” in many languages, from [SF-Hello](https://github.com/JaceThings/SF-Hello). Each word is a set of cubic Bézier strokes. Every point is `[x, y, z, r]`: `z` is depth (upstrokes sit behind the line, downstrokes in front) and `r` is the tube radius.
- **Glyphs.** `scripts/build_glyphs.py` cuts letters out of the Latin-script words at baseline minima (where the pen bottoms out with a horizontal tangent), so any two letters chain by translation. Letters the source words don't contain (f g k p q v w y) are assembled from parts of the others.
- **Composition** (`src/core/glyphs/compose.ts`). Letters join at the baseline. After a high exit (o b v w) or a descender's rising exit, a smooth connector is generated in place of the next letter's lead-in. Every join is then welded exactly, because in 3D every tube end shows.
- **3D** (`src/core/print/`). A round tube is swept along each stroke with rotation-minimising frames, so it never twists. For printing, tubes are cut into pieces that can't overlap themselves, then merged with [manifold-3d](https://github.com/elalish/manifold) into one watertight solid in a Web Worker.

The full technical write-up is in [`docs/`](docs/):

| Doc                                                      | Covers                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [Architecture](docs/architecture.md)                     | Data flow, folders, dependency rules, state, build        |
| [3D pipeline](docs/3d-pipeline.md)                       | Strokes → tubes → watertight solid → 3MF/STL, the preview |
| [Glyphs and composition](docs/glyphs-and-composition.md) | The glyph build, how letters join, weld, quality checks   |
| [Development](docs/development.md)                       | Commands, tests, recipes, conventions                     |

AI agents: start with [AGENTS.md](AGENTS.md).

## Development

| Command          | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `npm run dev`    | Vite dev server with hot reload                               |
| `npm run check`  | Typecheck, lint and test (what CI runs)                       |
| `npm test`       | Unit tests (Vitest)                                           |
| `npm run format` | Prettier                                                      |
| `npm run glyphs` | Regenerate `src/core/glyphs/glyph-data.json` (needs Python 3) |

### Project layout

```
├── data/source/        Apple stroke data (input to the glyph build)
├── docs/               Technical documentation
├── public/             Static assets (favicon)
├── scripts/            build_glyphs.py
├── src/
│   ├── app/            Root controller, layout, providers
│   ├── features/       text-input/, graphic/ (2D workspace), print/ (3D workspace)
│   ├── components/     ui/ primitives, layout/ page chrome, script-word/
│   ├── hooks/ settings/ utils/ config/
│   ├── core/           Pure engine: glyphs/, svg/, print/ (plan, geometry, csg, formats)
│   └── viewer/         three.js 3D preview
└── tests/              Vitest suites (mirror src/core)
```

Every source folder has a short `README.md`. Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploying

`npm run build` outputs a static site with relative asset paths. The included GitHub Actions workflow (`.github/workflows/deploy.yml`) publishes it to GitHub Pages on every push to `main`. To turn it on, open **Settings → Pages** and set **Source** to **GitHub Actions**.

## Credits

- Made by **[Amogh Padukone](https://github.com/AmoghPadukone)**.
- **Susan Kare** drew the original cursive “hello” for the Macintosh in 1984. Hellotype exists because of that lettering.
- Stroke data: [JaceThings/SF-Hello](https://github.com/JaceThings/SF-Hello) by Gigi ([@g-cqd](https://github.com/g-cqd)) and Jace ([@JaceThings](https://github.com/JaceThings)). The JSON files are © 2020 Apple Inc. They're included here, as in SF-Hello, for non-commercial, fan and educational use.
- CSG: [manifold-3d](https://github.com/elalish/manifold). Rendering: [three.js](https://threejs.org). UI: [React](https://react.dev), [Radix UI](https://www.radix-ui.com), [Tailwind CSS](https://tailwindcss.com) and [Lucide](https://lucide.dev).

## License

The source code is [MIT](LICENSE). The Apple stroke data in `data/source/` and the glyphs derived from it in `src/core/glyphs/glyph-data.json` are **not** covered by the MIT license; they remain © Apple Inc.
