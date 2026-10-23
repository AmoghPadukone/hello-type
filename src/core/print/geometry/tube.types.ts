import type { Vec3 } from './vec';

/** A point on a stroke's centreline with its (scaled) tube radius. */
export interface Sample {
  c: Vec3;
  r: number;
}

export interface TubeMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  /** After each ring along the path: indices drawn so far, ring centre and radius. */
  progress: { count: number; c: Vec3; r: number }[];
}

export interface TubeQuality {
  /** Vertices around the tube. */
  sides: number;
  /** Target ring spacing along the path, in glyph units. */
  step: number;
  /** Rings per hemispherical cap. */
  capRings: number;
}
