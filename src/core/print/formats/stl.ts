/** Binary STL writer (little-endian, 50 bytes per triangle, per-face normals). */
import { BRAND } from '@/config/brand';
import type { IndexedMesh } from './mesh.types';

const HEADER = `${BRAND.name} - binary STL, units: mm`;

export function toSTL({ positions: P, indices: I }: IndexedMesh): Blob {
  const triCount = I.length / 3;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  for (let i = 0; i < HEADER.length; i++) view.setUint8(i, HEADER.charCodeAt(i));
  view.setUint32(80, triCount, true);
  let o = 84;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3,
      b = I[t + 1] * 3,
      c = I[t + 2] * 3;
    const ux = P[b] - P[a],
      uy = P[b + 1] - P[a + 1],
      uz = P[b + 2] - P[a + 2];
    const wx = P[c] - P[a],
      wy = P[c + 1] - P[a + 1],
      wz = P[c + 2] - P[a + 2];
    let nx = uy * wz - uz * wy,
      ny = uz * wx - ux * wz,
      nz = ux * wy - uy * wx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    for (const v of [
      nx,
      ny,
      nz,
      P[a],
      P[a + 1],
      P[a + 2],
      P[b],
      P[b + 1],
      P[b + 2],
      P[c],
      P[c + 1],
      P[c + 2],
    ]) {
      view.setFloat32(o, v, true);
      o += 4;
    }
    o += 2; // attribute byte count
  }
  return new Blob([buf], { type: 'model/stl' });
}
