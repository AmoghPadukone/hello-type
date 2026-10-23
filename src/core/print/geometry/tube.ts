/**
 * Strokes → triangle meshes. Sweeps a round tube along strokes, following each point's depth
 * (z) and radius (r) the way Apple's 3D "hello" does.
 *
 * - Rotation-minimising frames (double reflection) so the tube never twists.
 * - Hemispherical end caps; strokes split at sharp turns, each side getting its own cap.
 * - Every tube is a closed, outward-wound surface (watertight).
 * - Indices are emitted in path order and `progress` records the index count after each
 *   ring, so a viewer can "draw on" the tube with a draw range.
 */
import { bezierPoint } from '@/core/bezier';
import type { Stroke } from '@/core/types';
import { CHUNK_TURN, PREVIEW_QUALITY, PRINT_QUALITY, SHARP } from './tube.constants';
import type { Sample, TubeMesh, TubeQuality } from './tube.types';
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from './vec';

/** Points along a stroke roughly `step` apart, split into pieces at sharp turns. */
export function samplePieces(stroke: Stroke, radiusScale: number, step: number): Sample[][] {
  const pts: Sample[] = [];
  for (const seg of stroke) {
    let poly = 0;
    for (let i = 0; i < 3; i++) {
      poly += Math.hypot(seg[i + 1][0] - seg[i][0], seg[i + 1][1] - seg[i][1], seg[i + 1][2] - seg[i][2]);
    }
    const n = Math.max(2, Math.ceil(poly / step));
    for (let i = pts.length ? 1 : 0; i <= n; i++) {
      const [x, y, z, r] = bezierPoint(seg, i / n);
      const p: Sample = { c: [x, y, z], r: r * radiusScale };
      if (pts.length && length(sub(p.c, pts[pts.length - 1].c)) < 1e-3) continue;
      pts.push(p);
    }
  }
  if (pts.length < 2) return pts.length ? [pts] : [];

  const pieces: Sample[][] = [[pts[0]]];
  for (let i = 1; i < pts.length; i++) {
    const piece = pieces[pieces.length - 1];
    piece.push(pts[i]);
    if (i < pts.length - 1) {
      const a = normalize(sub(pts[i].c, pts[i - 1].c));
      const b = normalize(sub(pts[i + 1].c, pts[i].c));
      if (dot(a, b) < SHARP) pieces.push([pts[i]]);
    }
  }
  return pieces;
}

interface Frames {
  T: Vec3[];
  N: Vec3[];
  B: Vec3[];
}

function anyPerpendicular(t: Vec3): Vec3 {
  const axis: Vec3 = Math.abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  return normalize(cross(t, axis));
}

/** Rotation-minimising frames (double reflection method, Wang et al. 2008). */
function frames(pts: Sample[]): Frames {
  const n = pts.length;
  const T = pts.map((_, i) => normalize(sub(pts[Math.min(i + 1, n - 1)].c, pts[Math.max(i - 1, 0)].c)));
  const N: Vec3[] = [anyPerpendicular(T[0])];
  for (let i = 0; i < n - 1; i++) {
    const v1 = sub(pts[i + 1].c, pts[i].c);
    const c1 = dot(v1, v1) || 1;
    const rL = sub(N[i], scale(v1, (2 / c1) * dot(v1, N[i])));
    const tL = sub(T[i], scale(v1, (2 / c1) * dot(v1, T[i])));
    const v2 = sub(T[i + 1], tL);
    const c2 = dot(v2, v2) || 1;
    N.push(normalize(sub(rL, scale(v2, (2 / c2) * dot(v2, rL)))));
  }
  return { T, N, B: T.map((t, i) => cross(t, N[i])) };
}

type Cap = 'round' | 'flat';

class MeshBuilder {
  positions: number[] = [];
  normals: number[] = [];
  indices: number[] = [];
  progress: TubeMesh['progress'] = [];

  constructor(private readonly sides: number) {}

  vertex(p: Vec3, n: Vec3): number {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    return this.positions.length / 3 - 1;
  }

  /** A ring of `sides` vertices; normals tilt along `along` by `alongW` on caps. */
  ring(c: Vec3, r: number, N: Vec3, B: Vec3, nScale = 1, along: Vec3 = [0, 0, 0], alongW = 0): number {
    const first = this.positions.length / 3;
    for (let k = 0; k < this.sides; k++) {
      const a = (2 * Math.PI * k) / this.sides;
      const dir = add(scale(N, Math.cos(a)), scale(B, Math.sin(a)));
      this.vertex(add(c, scale(dir, r)), normalize(add(scale(dir, nScale), scale(along, alongW))));
    }
    return first;
  }

  /** Quads between consecutive rings (b follows a along the path), wound outward. */
  bridge(a: number, b: number) {
    for (let k = 0; k < this.sides; k++) {
      const k1 = (k + 1) % this.sides;
      this.indices.push(a + k, b + k1, b + k, a + k, a + k1, b + k1);
    }
  }

  /** Triangle fan closing a ring; `behind` when the centre lies before the ring along the path. */
  fan(center: number, ring: number, behind: boolean) {
    for (let k = 0; k < this.sides; k++) {
      const k1 = (k + 1) % this.sides;
      if (behind) this.indices.push(center, ring + k1, ring + k);
      else this.indices.push(center, ring + k, ring + k1);
    }
  }

  build(): TubeMesh {
    return {
      positions: new Float32Array(this.positions),
      normals: new Float32Array(this.normals),
      indices: new Uint32Array(this.indices),
      progress: this.progress,
    };
  }
}

function sphere(p: Sample, q: TubeQuality): TubeMesh {
  const m = new MeshBuilder(q.sides);
  const { c, r } = p;
  const N: Vec3 = [1, 0, 0],
    B: Vec3 = [0, 1, 0],
    T: Vec3 = [0, 0, 1];
  const south = m.vertex(sub(c, scale(T, r)), scale(T, -1));
  let prev = -1;
  for (let j = 1; j < q.capRings * 2; j++) {
    const th = -Math.PI / 2 + (Math.PI * j) / (q.capRings * 2);
    const cur = m.ring(
      add(c, scale(T, r * Math.sin(th))),
      r * Math.cos(th),
      N,
      B,
      Math.cos(th),
      T,
      Math.sin(th),
    );
    if (prev < 0) m.fan(south, cur, true);
    else m.bridge(prev, cur);
    prev = cur;
  }
  m.fan(m.vertex(add(c, scale(T, r)), T), prev, false);
  m.progress.push({ count: m.indices.length, c, r });
  return m.build();
}

/** One closed tube over pts (with their frames), capped round or flat at each end. */
function tube(pts: Sample[], f: Frames, start: Cap, end: Cap, q: TubeQuality): TubeMesh {
  const m = new MeshBuilder(q.sides);
  const last = pts.length - 1;
  let prev = -1;

  const capRing = (i: number, toward: Vec3, j: number) => {
    const th = (Math.PI / 2) * (j / q.capRings);
    const { c, r } = pts[i];
    return m.ring(
      add(c, scale(toward, r * Math.sin(th))),
      r * Math.cos(th),
      f.N[i],
      f.B[i],
      Math.cos(th),
      toward,
      Math.sin(th),
    );
  };

  if (start === 'round') {
    const t = scale(f.T[0], -1);
    const pole = m.vertex(add(pts[0].c, scale(t, pts[0].r)), t);
    for (let j = q.capRings - 1; j >= 1; j--) {
      const cur = capRing(0, t, j);
      if (prev < 0) m.fan(pole, cur, true);
      else m.bridge(prev, cur);
      prev = cur;
    }
  }
  pts.forEach((p, i) => {
    const cur = m.ring(p.c, p.r, f.N[i], f.B[i]);
    if (prev < 0) m.fan(m.vertex(p.c, scale(f.T[0], -1)), cur, true);
    else m.bridge(prev, cur);
    prev = cur;
    m.progress.push({ count: m.indices.length, c: p.c, r: p.r });
  });
  if (end === 'round') {
    const t = f.T[last];
    for (let j = 1; j < q.capRings; j++) {
      const cur = capRing(last, t, j);
      m.bridge(prev, cur);
      prev = cur;
    }
    m.fan(m.vertex(add(pts[last].c, scale(t, pts[last].r)), t), prev, false);
  } else {
    m.fan(m.vertex(pts[last].c, f.T[last]), prev, false);
  }
  m.progress[m.progress.length - 1].count = m.indices.length;
  return m.build();
}

const isDot = (piece: Sample[]) => piece.length === 1;

/** Viewer meshes: one tube per piece, in drawing order, tagged with its stroke index. */
export function buildTubes(
  strokes: readonly Stroke[],
  radiusScale = 1,
  q: TubeQuality = PREVIEW_QUALITY,
): (TubeMesh & { stroke: number })[] {
  const out: (TubeMesh & { stroke: number })[] = [];
  strokes.forEach((stroke, si) => {
    for (const piece of samplePieces(stroke, radiusScale, q.step)) {
      out.push({
        stroke: si,
        ...(isDot(piece) ? sphere(piece[0], q) : tube(piece, frames(piece), 'round', 'round', q)),
      });
    }
  });
  return out;
}

/**
 * Splits a piece into index ranges whose total turning stays under CHUNK_TURN, so no range
 * can overlap itself. Neighbouring ranges share their boundary sample.
 */
function chunkRanges(pts: Sample[]): [number, number][] {
  const out: [number, number][] = [];
  let from = 0;
  let turn = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = normalize(sub(pts[i].c, pts[i - 1].c));
    const b = normalize(sub(pts[i + 1].c, pts[i].c));
    turn += Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    if (turn > CHUNK_TURN && i - from > 2) {
      out.push([from, i]);
      from = i;
      turn = 0;
    }
  }
  out.push([from, pts.length - 1]);
  return out;
}

/**
 * Printable parts: closed tubes cut into self-overlap-free chunks (flat caps between chunks,
 * round caps at the real ends). Frames are computed once per piece, so the two chunks at a
 * boundary share an identical ring. Union the parts for a single watertight solid.
 */
export function buildSolidParts(
  strokes: readonly Stroke[],
  radiusScale = 1,
  q: TubeQuality = PRINT_QUALITY,
): TubeMesh[] {
  const parts: TubeMesh[] = [];
  for (const stroke of strokes) {
    for (const piece of samplePieces(stroke, radiusScale, q.step)) {
      if (isDot(piece)) {
        parts.push(sphere(piece[0], q));
        continue;
      }
      const f = frames(piece);
      const ranges = chunkRanges(piece);
      ranges.forEach(([a, b], i) => {
        const slice = { T: f.T.slice(a, b + 1), N: f.N.slice(a, b + 1), B: f.B.slice(a, b + 1) };
        parts.push(
          tube(
            piece.slice(a, b + 1),
            slice,
            i === 0 ? 'round' : 'flat',
            i === ranges.length - 1 ? 'round' : 'flat',
            q,
          ),
        );
      });
    }
  }
  return parts;
}
