# Hellotype

Type a word and see it written in the cursive "hello" script from the original Macintosh. You can save the result as an SVG or PNG, or export it as a 3D model to print.

**Live demo: https://amoghpadukone.github.io/hello-font/#graphic**

It's a small side project. I wanted to see if Apple's "hello" strokes could be turned into a full alphabet and then into something I could hold on my desk.

What it does:

- Writes any lowercase text in the script. 18 letters come straight from Apple's pen strokes; I built the rest from pieces of those.
- Animates the word being drawn, in the app and in an animated SVG export.
- Builds 3D text as a round tube that follows the pen path, using Apple's depth data so loops pass in front of and behind each other.
- Exports a single watertight 3MF or STL in millimetres. It can stand upright, sit on a base plate, or lie flat.

The original "hello" was drawn by Susan Kare for the Macintosh in 1984. The lettering and stroke data are © Apple Inc. This is a fan project and isn't affiliated with or endorsed by Apple. See [Credits](#credits).

## Quick start

You need Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # static site in dist/ (works from any sub-path, e.g. GitHub Pages)
npm run preview    # serve the production build
```

## Using it

Type in the text bar or pick an example. Lowercase a–z and spaces work; anything else is skipped and listed under the bar. Then choose Graphic or 3D print. Your choice is saved and kept in the URL (`#graphic` / `#print`), so you can link straight to either one.

### Graphic (SVG · PNG)

A 2D preview with **Appearance** (colour, stroke weight, drawing speed) and **Download**: SVG, an animated SVG that draws itself in the browser, or a transparent PNG.

### 3D print (3MF · STL)

A 3D preview you can drag to rotate. It shows what will be exported.

| Setting         | What it does                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Standing        | Exported upright. The bottom is sliced flat along the baseline (**Feet cut**), so every letter touching the desk gets a flat foot.       |
| Base plate      | Every word stands on a rounded slab at the baseline, joining multiple words into one piece. Descender loops (g j p q y f) sink into it.  |
| Lying flat      | Exported on its back. **Flatten back** shaves it flat so it prints without supports.                                                     |
| Thickness       | Tube thickness relative to Apple's (1.3× by default for sturdier prints).                                                                |
| Depth           | How far loops swing in front of and behind each other. 100% is Apple's; lower values fuse crossings into a stronger, more compact piece. |
| Dots on i and j | Appears when your text has an i or j. Pick how Apple's floating dots print (see below).                                                  |

**Dot styles.** Apple's i and j dots float above their stems, so on their own they'd print as loose pieces.

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

The panel estimates the finished size and warns about things like thin tubes, letters hanging above descender loops, and tip-over risk. After export it shows the real size, the number of feet and the volume.

**Printing tips:** standing pieces need supports under the loops (tree supports work well). Use 3MF if your slicer supports it, since it keeps units and topology. For short words, 120 mm or wider with Thickness ≥ 1.3× gives a sturdy piece.

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

More detail is in [`docs/`](docs/):

| Doc                                                      | Covers                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [Architecture](docs/architecture.md)                     | Data flow, folders, dependency rules, state, build        |
| [3D pipeline](docs/3d-pipeline.md)                       | Strokes → tubes → watertight solid → 3MF/STL, the preview |
| [Glyphs and composition](docs/glyphs-and-composition.md) | The glyph build, how letters join, weld, quality checks   |
| [Development](docs/development.md)                       | Commands, tests, recipes, conventions                     |

If you're using an AI coding agent, point it at [AGENTS.md](AGENTS.md).

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

Each source folder has a short `README.md`. Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploying

`npm run build` outputs a static site with relative asset paths. The GitHub Actions workflow in `.github/workflows/deploy.yml` publishes it to GitHub Pages on every push to `main`. To enable it, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## Credits

- Made by [Amogh Padukone](https://github.com/AmoghPadukone). Source: [AmoghPadukone/hello-font](https://github.com/AmoghPadukone/hello-font).
- **Susan Kare** drew the original cursive “hello” for the Macintosh in 1984. This project wouldn't exist without that lettering.
- Stroke data: [JaceThings/SF-Hello](https://github.com/JaceThings/SF-Hello) by Gigi ([@g-cqd](https://github.com/g-cqd)) and Jace ([@JaceThings](https://github.com/JaceThings)). The JSON files are © 2020 Apple Inc. They're included here, as in SF-Hello, for non-commercial, fan and educational use.
- CSG: [manifold-3d](https://github.com/elalish/manifold). Rendering: [three.js](https://threejs.org). UI: [React](https://react.dev), [Radix UI](https://www.radix-ui.com), [Tailwind CSS](https://tailwindcss.com) and [Lucide](https://lucide.dev).

## License

The source code is [MIT](LICENSE). The Apple stroke data in `data/source/` and the glyphs derived from it in `src/core/glyphs/glyph-data.json` are **not** covered by the MIT license; they remain © Apple Inc.
