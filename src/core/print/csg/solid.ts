/**
 * Print plan → one watertight solid, with manifold-3d (WASM). Unions the tube chunks, drills
 * pin sockets, trims at the cut plane, adds the base plate, rotates standing pieces upright,
 * scales to millimetres and measures the result. Runs inside the export worker only.
 */
import type { Manifold, ManifoldToplevel } from 'manifold-3d';
import { buildSolidParts } from '@/core/print/geometry/tube';
import type { PrintPlan } from '@/core/print/plan.types';
import type { SolidResult } from './solid.types';

/** Pin-and-socket proportions: peg radius and socket depth relative to the dot radius. */
const PIN = { pegRatio: 0.4, depthRatio: 1.4, clearanceMM: 0.15, gapMM: 4, flatten: 0.25 };

/** Smallest component kept, in glyph units³ (a 1-unit cube is ≈ 0.05 mm on a side at typical sizes). */
const MIN_COMPONENT_VOLUME = 1;

/**
 * Where chunk caps meet face to face the union can leave zero-volume sliver shells; they
 * are not geometry, but slicers (and the body count) would see them as extra parts.
 */
function dropSlivers({ Manifold }: ManifoldToplevel, solid: Manifold): Manifold {
  const comps = solid.decompose();
  const real = comps.filter(c => c.volume() > MIN_COMPONENT_VOLUME);
  const out = Manifold.compose(real);
  comps.forEach(c => c.delete());
  return out;
}

/**
 * Builds a print plan as one watertight solid, in millimetres with the bed at z = 0.
 * Standing pieces are rotated upright so their feet / plate sit on the bed.
 */
export function buildSolid(wasm: ManifoldToplevel, plan: PrintPlan): SolidResult {
  const { Manifold, Mesh } = wasm;
  const made: { delete(): void }[] = [];
  const keep = <T extends { delete(): void }>(m: T): T => (made.push(m), m);
  try {
    const parts = buildSolidParts(plan.strokes, plan.radiusScale).map(p =>
      keep(new Manifold(new Mesh({ numProp: 3, vertProperties: p.positions, triVerts: p.indices }))),
    );
    let solid: Manifold = keep(dropSlivers(wasm, keep(Manifold.union(parts))));
    // Sockets for pin dots, drilled down into each stem top (glyph y axis).
    for (const { stem, dot } of plan.pins) {
      const pegR = PIN.pegRatio * dot[3] * plan.radiusScale;
      const depth = PIN.depthRatio * dot[3] * plan.radiusScale;
      const radius = pegR + PIN.clearanceMM / plan.s;
      const height = depth + 2 * stem[3] * plan.radiusScale;
      // A cylinder runs along z; −90° about x turns it to run along +y.
      const socket = keep(
        keep(keep(Manifold.cylinder(height, radius, radius, 32)).rotate([-90, 0, 0])).translate([
          stem[0],
          stem[1] - depth,
          stem[2],
        ]),
      );
      solid = keep(solid.subtract(socket));
    }
    if (plan.cut) {
      const normal: [number, number, number] = [0, 0, 0];
      normal[plan.cut.axis] = 1;
      solid = keep(solid.trimByPlane(normal, plan.cut.at));
    }
    if (plan.plate) {
      const { min, max, round } = plan.plate;
      const corners: Manifold[] = [];
      for (const x of [min[0] + round, max[0] - round])
        for (const y of [min[1] + round, max[1] - round])
          for (const z of [min[2] + round, max[2] - round])
            corners.push(keep(keep(Manifold.sphere(round, 24)).translate([x, y, z])));
      solid = keep(Manifold.union(solid, keep(Manifold.hull(corners))));
    }
    // Standing: glyph y (up) becomes print z. +90° about x maps (x, y, z) → (x, −z, y).
    if (plan.orientation === 'stand') solid = keep(solid.rotate([90, 0, 0]));
    solid = keep(solid.scale(plan.s));
    const b = solid.boundingBox();
    solid = keep(solid.translate([-b.min[0], -b.min[1], -b.min[2]]));
    if (solid.status() !== 'NoError') throw new Error(`Mesh error: ${solid.status()}`);

    const box = solid.boundingBox();
    const contact = keep(solid.slice(0.05));
    const patches = contact.decompose();
    patches.forEach(p => p.delete());
    const cb = contact.bounds();
    const bodies = solid.decompose();
    bodies.forEach(p => p.delete());

    // Pin dots print on the bed beside the word: a ball flattened underneath, peg pointing up.
    let x = box.max[0] + PIN.gapMM;
    const pinBodies = plan.pins.map(({ dot }) => {
      const R = dot[3] * plan.radiusScale * plan.s;
      const pegR = PIN.pegRatio * R;
      const pegLength = PIN.depthRatio * R * 0.92;
      const ball = keep(keep(Manifold.sphere(R, 48)).trimByPlane([0, 0, 1], -(1 - PIN.flatten) * R));
      const peg = keep(
        keep(Manifold.cylinder(pegLength + R * 0.5, pegR, pegR, 32)).translate([0, 0, R * 0.5]),
      );
      const part = keep(
        keep(Manifold.union(ball, peg)).translate([x + R, box.max[1] / 2, (1 - PIN.flatten) * R]),
      );
      x += 2 * R + PIN.gapMM;
      return part;
    });
    if (pinBodies.length) solid = keep(Manifold.compose([solid, ...pinBodies]));
    const total = solid.boundingBox();

    const mesh = solid.getMesh();
    return {
      positions: mesh.vertProperties.slice(),
      indices: mesh.triVerts.slice(),
      size: [0, 1, 2].map(k => total.max[k] - total.min[k]) as [number, number, number],
      footprint: {
        count: patches.length,
        x: cb.max[0] - cb.min[0],
        y: cb.max[1] - cb.min[1],
        area: contact.area(),
      },
      bodies: bodies.length,
      pinParts: pinBodies.length,
      tubeMM: 60 * plan.radiusScale * plan.s,
      volumeMM3: solid.volume(),
    };
  } finally {
    for (const m of made) m.delete();
  }
}
