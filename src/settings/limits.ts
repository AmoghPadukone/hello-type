/** Ranges for the shared settings. Sliders spread these in directly; print limits are PRINT_LIMITS in core/print/settings.ts. */
export const LIMITS = {
  weight: { min: 20, max: 120, step: 1 },
  speed: { min: 0.25, max: 3, step: 0.25 },
  textLength: 80,
} as const;
