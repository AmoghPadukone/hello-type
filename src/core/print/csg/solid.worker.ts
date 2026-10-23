/// <reference lib="webworker" />
/**
 * Worker entry: runs the CSG export off the main thread. Loads the manifold WASM once, then
 * answers each request with one result (or error). Mesh buffers are transferred, not copied.
 */
import Module, { type ManifoldToplevel } from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import { buildSolid } from './solid';
import type { WorkerRequest, WorkerResponse } from './solid.types';

let wasm: Promise<ManifoldToplevel> | undefined;
const manifold = () =>
  (wasm ??= Module({ locateFile: () => wasmUrl }).then(w => {
    w.setup();
    return w;
  }));

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const result = buildSolid(await manifold(), data.plan);
    (self as DedicatedWorkerGlobalScope).postMessage({ id: data.id, result } satisfies WorkerResponse, [
      result.positions.buffer,
      result.indices.buffer,
    ]);
  } catch (err) {
    self.postMessage({
      id: data.id,
      error: err instanceof Error ? err.message : String(err),
    } satisfies WorkerResponse);
  }
};
