# viewer

The 3D preview: one `Viewer` class over a three.js scene.

- `viewer.ts`: builds preview tubes from a `PrintPlan`, merges them into one mesh, animates the draw-on with a draw range and a rounded tip, shows the cut with a clipping plane and the base plate as a rounded box. It owns every GPU resource; call `dispose()`.
- `viewer.constants.ts`: camera, lighting, material and framing values.

It is loaded only by the dynamic import in `features/print/hooks/use-viewer.ts`, so three.js is a separate chunk and the 2D tool works without WebGL. Don't import it statically (lint enforces this). Colour changes update materials only; a plan change rebuilds the mesh.

Details: [docs/3d-pipeline.md](../../docs/3d-pipeline.md#6-the-live-preview).
