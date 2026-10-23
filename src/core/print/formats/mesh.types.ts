/** An indexed triangle mesh in millimetres (print coordinates: z up, bed at z = 0). */
export interface IndexedMesh {
  positions: Float32Array;
  indices: Uint32Array;
}
