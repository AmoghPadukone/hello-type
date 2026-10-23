import { normalizePrint } from '@/core/print/settings';
import type { PrintSettings } from '@/core/print/plan.types';
import { DEFAULT_SETTINGS } from './defaults';
import { LIMITS } from './limits';
import type { Mode, Settings } from './settings.types';

export const isMode = (v: unknown): v is Mode => v === 'graphic' || v === 'print';

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** Coerces untrusted input (storage, URL) into valid settings. */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  return {
    mode: isMode(r.mode) ? r.mode : d.mode,
    text: typeof r.text === 'string' ? r.text.slice(0, LIMITS.textLength) : d.text,
    color: isColor(r.color) ? r.color.toLowerCase() : d.color,
    weight: clamp(r.weight, LIMITS.weight.min, LIMITS.weight.max, d.weight),
    speed: clamp(r.speed, LIMITS.speed.min, LIMITS.speed.max, d.speed),
    checker: r.checker === true,
    print: normalizePrint({ ...d.print, ...((r.print as Partial<PrintSettings>) ?? {}) }),
  };
}
