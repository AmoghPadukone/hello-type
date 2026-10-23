# core/print

Everything between strokes and a printable file. The full walkthrough is [docs/3d-pipeline.md](../../../docs/3d-pipeline.md).

| Path          | Role                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `plan.ts`     | `printPlan()`: depth scale, dot styles, mm scale, cut line, base plate. Shared by preview and export |
| `settings.ts` | `DEFAULT_PRINT`, `PRINT_LIMITS`, `normalizePrint`                                                    |
| `estimate.ts` | Approximate size and warnings from a plan, without meshing                                           |
| `dots/`       | The ten i/j dot styles, built from the stem top and the original dot                                 |
| `geometry/`   | `tube.ts`: rotation-minimising frames, closed tubes with round caps; `vec.ts`                        |
| `csg/`        | manifold-3d solid (`solid.ts`), the worker entry, and the main-thread `client.ts`                    |
| `formats/`    | Pure 3MF (with a stored ZIP writer) and binary STL writers                                           |

Two invariants to keep:

- Every tube from `geometry/tube.ts` is closed and outward-wound. `tests/core/print/geometry.test.ts` checks it.
- Export chunks share boundary rings because frames are computed once per piece. Don't compute frames per chunk.

`csg/` can't be unit-tested (it needs WASM). After changing it, export from the app and check the status line.
