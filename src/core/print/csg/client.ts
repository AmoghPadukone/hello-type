/**
 * Main-thread client for the export worker: `buildSolidInWorker(plan)` returns a promise of the
 * solid. The worker is created lazily and reused across exports.
 */
import type { PrintPlan } from '@/core/print/plan.types';
import type { SolidResult, WorkerRequest, WorkerResponse } from './solid.types';

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, { resolve: (r: SolidResult) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  // Vite bundles the worker only when it is referenced in exactly this `new URL(…)` form.
  worker = new Worker(new URL('./solid.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    const job = pending.get(data.id);
    if (!job) return;
    pending.delete(data.id);
    if ('error' in data) job.reject(new Error(data.error));
    else job.resolve(data.result);
  };
  worker.onerror = e => {
    for (const job of pending.values())
      job.reject(new Error(e.message || 'The export worker failed to start.'));
    pending.clear();
    worker = undefined;
  };
  return worker;
}

export function buildSolidInWorker(plan: PrintPlan): Promise<SolidResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, plan } satisfies WorkerRequest);
  });
}
