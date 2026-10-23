import { describe, expect, it } from 'vitest';
import { compose } from '@/core/glyphs/compose';
import { buildSolidParts, buildTubes } from '@/core/print/geometry/tube';
import type { TubeMesh } from '@/core/print/geometry/tube.types';

/** Every directed edge appears exactly once and its reverse exactly once; volume is positive. */
function checkClosed({ positions: P, indices: I }: TubeMesh) {
  const edges = new Map<string, number>();
  let volume = 0;
  for (let t = 0; t < I.length; t += 3) {
    const v = [I[t], I[t + 1], I[t + 2]];
    for (const [a, b] of [
      [v[0], v[1]],
      [v[1], v[2]],
      [v[2], v[0]],
    ])
      edges.set(`${a}>${b}`, (edges.get(`${a}>${b}`) ?? 0) + 1);
    const [a, b, c] = v.map(i => [P[3 * i], P[3 * i + 1], P[3 * i + 2]]);
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
  }
  let open = 0;
  for (const [k, n] of edges) {
    const [a, b] = k.split('>');
    if (n !== 1 || edges.get(`${b}>${a}`) !== 1) open++;
  }
  return { open, volume };
}

describe('tube meshes', () => {
  const { strokes } = compose('hello quiet jumping abcdefghijklmnopqrstuvwxyz');

  it('builds closed, outward-facing printable parts', () => {
    const parts = buildSolidParts(strokes);
    expect(parts.length).toBeGreaterThan(strokes.length);
    for (const part of parts) {
      const { open, volume } = checkClosed(part);
      expect(open).toBe(0);
      expect(volume).toBeGreaterThan(0);
    }
  });

  it('builds closed preview tubes with monotonic draw-on progress', () => {
    for (const tube of buildTubes(compose('hi').strokes)) {
      expect(checkClosed(tube).open).toBe(0);
      const counts = tube.progress.map(p => p.count);
      expect(counts).toEqual([...counts].sort((a, b) => a - b));
      expect(counts[counts.length - 1]).toBe(tube.indices.length);
    }
  });

  it('scales the tube radius', () => {
    const extent = (r: number) => {
      const p = buildTubes(compose('o').strokes, r)[0].positions;
      let min = Infinity,
        max = -Infinity;
      for (let i = 2; i < p.length; i += 3) {
        min = Math.min(min, p[i]);
        max = Math.max(max, p[i]);
      }
      return max - min;
    };
    expect(extent(2)).toBeGreaterThan(extent(1));
  });
});
