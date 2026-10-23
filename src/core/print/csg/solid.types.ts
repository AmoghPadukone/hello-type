import type { IndexedMesh } from '@/core/print/formats/mesh.types';
import type { PrintPlan } from '@/core/print/plan.types';

export interface SolidResult extends IndexedMesh {
  /** Bounding size in print coordinates (x, y on the bed; z up), millimetres. */
  size: [number, number, number];
  /** What touches the bed: separate contact patches and their overall spread. */
  footprint: { count: number; x: number; y: number; area: number };
  /** Separate bodies in the word itself (1 = one connected print); excludes pin dots. */
  bodies: number;
  /** Pin-and-socket dots laid on the bed beside the word. */
  pinParts: number;
  tubeMM: number;
  volumeMM3: number;
}

/** Messages between `client.ts` (main thread) and `solid.worker.ts`. */
export type WorkerRequest = { id: number; plan: PrintPlan };
export type WorkerResponse = { id: number; result: SolidResult } | { id: number; error: string };
