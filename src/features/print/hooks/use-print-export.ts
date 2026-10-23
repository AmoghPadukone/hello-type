import { useState } from 'react';
import { DEFAULT_NAME } from '@/config/constants';
import { buildSolidInWorker } from '@/core/print/csg/client';
import { toSTL } from '@/core/print/formats/stl';
import { to3MF } from '@/core/print/formats/threemf';
import type { PrintPlan } from '@/core/print/plan.types';
import { downloadBlob } from '@/utils/file';
import { slug } from '@/utils/text';
import type { ExportFormat, ExportStatus } from '../print.types';
import { exportSummary } from '../utils/export-summary';

/** Builds the solid in the worker, downloads it and summarises what was saved. */
export function usePrintExport(plan: PrintPlan | null, text: string) {
  const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' });

  async function exportModel(format: ExportFormat) {
    if (!plan || status.kind === 'busy') return;
    setStatus({ kind: 'busy', format });
    try {
      const solid = await buildSolidInWorker(plan);
      const name = `${slug(text)}.${format}`;
      downloadBlob(format === 'stl' ? toSTL(solid) : to3MF(solid, text.trim() || DEFAULT_NAME), name);
      setStatus({ kind: 'done', ...exportSummary(solid, plan, text, name) });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: `Couldn’t build the model: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return { status, exportModel, busy: status.kind === 'busy' };
}
