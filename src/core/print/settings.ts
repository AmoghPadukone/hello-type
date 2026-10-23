/**
 * Print settings: defaults, slider limits and normalisation. Every print setting from the UI,
 * storage or a URL goes through `normalizePrint` before it reaches the plan.
 */
import { DEFAULT_DOT_STYLE } from './dots/dots.constants';
import { isDotStyle } from './dots/dots';
import type { PrintSettings } from './plan.types';

export const DEFAULT_PRINT: PrintSettings = {
  thickness: 1.3,
  depth: 1,
  widthMM: 120,
  orientation: 'stand',
  feetMM: 1.5,
  base: 'feet',
  plateMM: 2.5,
  plateMarginMM: 4,
  flatBack: 0,
  dots: DEFAULT_DOT_STYLE,
};

export const PRINT_LIMITS = {
  thickness: { min: 0.8, max: 2, step: 0.05 },
  depth: { min: 0.2, max: 1, step: 0.05 },
  widthMM: { min: 30, max: 300, step: 5 },
  feetMM: { min: 0.5, max: 4, step: 0.25 },
  plateMM: { min: 1, max: 8, step: 0.5 },
  plateMarginMM: { min: 0, max: 20, step: 0.5 },
  flatBack: { min: 0, max: 0.7, step: 0.05 },
} as const;

const clamp = (v: number, { min, max }: { min: number; max: number }, fallback: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/** Coerces untrusted settings (URL, storage, inputs) into valid ranges. */
export function normalizePrint(s: Partial<PrintSettings>): PrintSettings {
  const d = DEFAULT_PRINT;
  return {
    thickness: clamp(Number(s.thickness), PRINT_LIMITS.thickness, d.thickness),
    depth: clamp(Number(s.depth), PRINT_LIMITS.depth, d.depth),
    widthMM: clamp(Number(s.widthMM), PRINT_LIMITS.widthMM, d.widthMM),
    orientation: s.orientation === 'flat' ? 'flat' : 'stand',
    feetMM: clamp(Number(s.feetMM), PRINT_LIMITS.feetMM, d.feetMM),
    base: s.base === 'plate' ? 'plate' : 'feet',
    plateMM: clamp(Number(s.plateMM), PRINT_LIMITS.plateMM, d.plateMM),
    plateMarginMM: clamp(Number(s.plateMarginMM), PRINT_LIMITS.plateMarginMM, d.plateMarginMM),
    flatBack: clamp(Number(s.flatBack), PRINT_LIMITS.flatBack, d.flatBack),
    dots: isDotStyle(s.dots) ? s.dots : d.dots,
  };
}
