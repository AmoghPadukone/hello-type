# The 3D pipeline

How a line of cursive text becomes a round tube on screen and a watertight solid you can print.

The lettering is not an extruded outline. Each pen stroke is a centreline with a depth and a radius at every point. A round tube is swept along that centreline, so loops pass in front of and behind each other the way they do in Apple's 3D "hello".

```
strokes [x, y, z, r]                                     (core/glyphs/compose.ts)
   │
   ▼
printPlan(strokes, kinds, weight, settings)              (core/print/plan.ts)
   │  depth scale · i/j dot styles · mm scale · cut line · base plate
   │
   ├──▶ Viewer.setPlan(plan)                             (viewer/viewer.ts, main thread)
   │       buildTubes → one merged mesh → draw-on animation, clip plane, plate
   │
   └──▶ buildSolidInWorker(plan)                         (core/print/csg/client.ts)
           └─ worker: buildSolid(manifold, plan)         (core/print/csg/solid.ts)
                 buildSolidParts → union → sockets → trim → plate → rotate → scale
                 └──▶ toSTL / to3MF                      (core/print/formats/)
```

The preview and the export both read the same `PrintPlan`. Whatever the preview shows (cut height, plate, dot shapes) is what gets exported.

## 1. The input: strokes with depth and radius

A `Point` is `[x, y, z, r]` in glyph units (`core/types.ts`):

| Field  | Meaning                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `x, y` | Position on the writing plane, y up. Baseline 0, x-height ≈ 380, ascender ≈ 737, descender ≈ −330.                               |
| `z`    | Depth from Apple's 3D "hello". Upstrokes sit behind (≈ −30) and downstrokes in front (≈ +50), so crossing strokes don't collide. |
| `r`    | Tube radius, ≈ 30 (the 2D stroke width is 60).                                                                                   |

A `Stroke` is a list of cubic Bézier segments over these 4D points. The 2D SVG ignores `z` and `r`.

`compose` hands over strokes whose joins are exact (see [glyphs-and-composition.md](glyphs-and-composition.md#weld)). Exact joins matter in 3D: a stroke end that stops just short of another stroke shows up as a bump or a gap.

## 2. The print plan

`printPlan` (`core/print/plan.ts`) is pure and synchronous. It runs on every change in the print workspace and again inside the worker.

1. **Normalise** the settings (`normalizePrint` in `core/print/settings.ts`).
2. **Tube size.** `radiusScale = (weight / 60) × thickness`. Every radius is multiplied by it.
3. **Depth.** Every `z` is multiplied by `depth` (1 = Apple's swing; lower values fuse crossings into a stronger piece).
4. **Dots and crossbars** (`applyDots`, `core/print/dots/dots.ts`). Apple's i/j dots float, so each zero-length mark is replaced according to the chosen `DotStyle`:
   - Connected styles (teardrop, curl, swash, loop, tether, back rod, accent) add strokes built in a frame anchored at the stem top S and the original dot D. The same shape fits any i or j at any size. Fine rods are at least `MIN_ROD_MM` (1.3 mm) thick.
   - `bead` and crossbars are moved toward the word until their tubes overlap by `MARK_OVERLAP`.
   - `pin` moves the dot into `previewOnly` and records a `Pin` (stem top and dot), so the CSG step can drill a socket and lay a pegged dot beside the word.
   - `floating` leaves the dot as a loose part.
5. **Scale.** `s = widthMM / (maxX − minX)` is millimetres per glyph unit, measured on the tube's outer extent.
6. **Standing pieces.**
   - `footY` is the lowest pen _local minimum_ above the descender zone (y > −60). Strokes that only pass through the baseline on their way down don't count as feet.
   - Without a plate, the cut is at `footY + feetMM / s` on the y axis, so every letter touching the desk gets a flat foot.
   - With a plate, the slab's top sits 0.4 mm above the feet cut line or the highest foot, whichever is higher, so no letter floats. The cut moves to the slab's underside, so descenders sink into the plate and every word joins it. Plate thickness, margin and corner radius are in millimetres, independent of the text width.
7. **Lying flat.** `flatBack` cuts on the z axis at `minZ + flatBack × 30 × radiusScale`, so the back prints without supports.

`estimate` (`core/print/estimate.ts`) turns a plan into an approximate size and a list of warnings (thin tube, trimmed descenders, tip-over risk, loose dots) without building a mesh.

## 3. Sweeping a tube

`core/print/geometry/tube.ts` builds triangle meshes from strokes.

**Sampling** (`samplePieces`). Each cubic is sampled roughly `step` glyph units apart, interpolating all four coordinates. Wherever the direction turns more than 55° between samples (`SHARP`), the stroke is split into separate pieces. Each piece gets its own end caps, which gives a rounded elbow instead of a pinched crease. A piece with a single sample is a dot and becomes a sphere.

**Frames.** Each ring needs two axes (N, B) perpendicular to the path. They come from **rotation-minimising frames** using the double-reflection method (Wang et al. 2008), so the tube never twists along a stroke. Frenet frames would flip at inflection points, which are everywhere in cursive.

**Rings, bridges, caps.**

```
   pole                                                   pole
    ●  fan   ◯ cap rings   ◯ ring  ◯ ring  ◯ ring   ◯ cap rings  fan  ●
    └──── hemisphere ────┘ └─ quads between rings ─┘ └──── hemisphere ────┘
```

- A ring is `sides` vertices around the sample's centre at its radius.
- Consecutive rings are bridged with quads (two triangles each), wound so normals face outward.
- Round ends are hemispheres: `capRings` shrinking rings, then a triangle fan to a pole. Flat ends (used between export chunks) are a single fan.

| Quality | sides | step (glyph units) | capRings |
| ------- | ----- | ------------------ | -------- |
| Preview | 24    | 10                 | 6        |
| Print   | 32    | 8                  | 8        |

**Invariants**, enforced by `tests/core/print/geometry.test.ts`:

- Every tube is **closed**: each directed edge appears exactly once together with its reverse.
- Every tube is **outward-wound**: its signed volume is positive.

### Preview tubes vs print parts

`buildTubes` (preview) emits one tube per piece, in drawing order. It also records `progress`: after each ring, how many indices have been emitted and where the ring is. The viewer uses that for the draw-on animation.

`buildSolidParts` (print) also cuts each piece into **chunks** whose total turning stays under 150° (`CHUNK_TURN`). A chunk that turns less than 180° can't overlap itself, and a self-overlapping mesh is not a valid input to a boolean union. Chunks meet at flat caps; only the real stroke ends are round.

Frames are computed **once per piece** and sliced per chunk, so two neighbouring chunks share an identical boundary ring. Recomputing frames per chunk would rotate those rings slightly, and the chunks would no longer meet exactly.

## 4. Building the solid (CSG)

`core/print/csg/solid.ts` uses [manifold-3d](https://github.com/elalish/manifold) (WebAssembly). It runs only in the worker (`solid.worker.ts`), which loads the WASM once and transfers the result's buffers back without copying.

1. **Union** every chunk into one manifold.
2. **Drop slivers.** Where chunk caps meet face to face, the union can leave zero-volume shells. Components smaller than 1 glyph unit³ are removed, so slicers and the body count don't see phantom parts.
3. **Sockets.** For each pin dot, subtract a cylinder drilled down into the stem top (peg radius 0.4 × dot radius plus 0.15 mm clearance, depth 1.4 × dot radius).
4. **Trim** everything below the plan's cut plane.
5. **Plate.** The hull of eight corner spheres gives a rounded slab, which is unioned in.
6. **Stand it up.** Standing pieces rotate +90° about x, so glyph y (up) becomes print z: (x, y, z) → (x, −z, y).
7. **Scale** by `s` to millimetres and translate so the bounding box starts at the origin, with the bed at z = 0.
8. **Measure.**
   - `footprint`: slice at z = 0.05 mm and count the separate contact patches (the feet).
   - `bodies`: the number of disconnected components (1 means one connected print).
   - `size` and `volumeMM3`.
9. **Pin dots** are laid on the bed beside the word, 4 mm apart: a ball flattened by 25% underneath with the peg pointing up.

The status line after an export (`features/print/utils/export-summary.ts`) reports these numbers.

The CSG step needs WASM, so it isn't unit-tested. After changing it, export from the running app and check that the status line reports the expected size, number of feet and pieces.

## 5. File formats

`core/print/formats/` holds pure writers that take an `IndexedMesh` (millimetres, z up):

- **3MF** (`threemf.ts`): the core-spec XML model in a stored (uncompressed) ZIP written by `zip.ts`. Units are explicit, so it is the default.
- **STL** (`stl.ts`): binary, an 84-byte header plus 50 bytes per triangle with per-face normals.

## 6. The live preview

`viewer/viewer.ts` is a three.js scene owned by one class. React loads it with a dynamic import (`features/print/hooks/use-viewer.ts`), so three.js is a separate chunk and the 2D tool works without WebGL.

- **One mesh.** All preview tubes (including pin dots from `previewOnly`) are merged in drawing order into a single `BufferGeometry`. The viewer builds a **timeline** with one entry per ring: when the pen reaches it (from `strokeDuration` in `core/svg/svg.ts`, the same timing as the 2D preview) and the index count drawn so far.
- **Draw-on.** Each frame, a binary search finds the current ring. The geometry's draw range is set to that index count, and a sphere at the ring's centre and radius rounds off the growing end.
- **The cut** is shown with a clipping plane; the preview never runs CSG. A second material draws only back faces, flat and slightly darker, so the inside of the tube seen through the cut reads as a solid face.
- **The plate** is a `RoundedBoxGeometry` at the plan's plate bounds.
- **Updates.** Colour changes only update materials, never geometry. A plan change rebuilds the mesh; the plan the preview receives is debounced by 120 ms (`DEBOUNCE_MS.previewPlan`).
- **Cleanup.** `dispose()` frees every GPU resource; `useViewer` calls it on unmount.

Scene tuning (camera, lights, materials, framing) is in `viewer/viewer.constants.ts`.

## Where to change what

| Goal                                      | Start in                                                |
| ----------------------------------------- | ------------------------------------------------------- |
| Smoother or lighter tubes                 | `core/print/geometry/tube.constants.ts`                 |
| How feet, the plate or flat backs are cut | `core/print/plan.ts`                                    |
| A new dot style                           | `core/print/dots/` (+ `DotIcon.view.tsx`)               |
| Sockets, pegs, boolean steps              | `core/print/csg/solid.ts`                               |
| A new print setting                       | see [development.md](development.md#add-a-print-option) |
| A new export format                       | `core/print/formats/` + `usePrintExport`                |
| Look of the preview                       | `viewer/viewer.constants.ts`, `viewer/viewer.ts`        |
