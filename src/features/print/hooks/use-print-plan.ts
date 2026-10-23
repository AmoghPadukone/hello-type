import { useMemo } from 'react';
import { DEBOUNCE_MS } from '@/config/constants';
import { printPlan } from '@/core/print/plan';
import type { PrintSettings } from '@/core/print/plan.types';
import type { Stroke, StrokeKind } from '@/core/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/**
 * One plan per change, shared by the print panels and the export. The 3D preview gets a
 * debounced copy, because rebuilding its mesh is the expensive part.
 */
export function usePrintPlan(
  strokes: readonly Stroke[],
  kinds: readonly StrokeKind[],
  weight: number,
  print: PrintSettings,
) {
  const plan = useMemo(() => printPlan(strokes, kinds, weight, print), [strokes, kinds, weight, print]);
  const previewPlan = useDebouncedValue(plan, DEBOUNCE_MS.previewPlan);
  return { plan, previewPlan };
}
