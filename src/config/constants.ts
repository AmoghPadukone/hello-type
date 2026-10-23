/** App-wide timings, keys and sizes. Domain tuning (letters, tubes, scene) lives next to its module in core/ and viewer/. */

/** localStorage key for persisted settings. Bump the version when the shape changes incompatibly. */
export const STORAGE_KEY = 'hellotype:settings:v1';

/** Debounce delays in milliseconds. */
export const DEBOUNCE_MS = {
  /** Settings are written to storage once edits pause. */
  persist: 300,
  /** The 3D preview rebuilds its mesh once edits pause (the print panels update immediately). */
  previewPlan: 120,
  /** The drawing replays once typing pauses. */
  replay: 400,
} as const;

export const TOOLTIP_DELAY_MS = 250;
/** How often the empty text box's placeholder moves to the next example. */
export const PLACEHOLDER_INTERVAL_MS = 2200;

/** PNG export: at most this many pixels wide, and at most this many times the SVG's viewBox. */
export const PNG_EXPORT = { maxWidth: 3000, maxScale: 4 } as const;

/** Fallback for file names and 3MF titles when the text has no usable characters. */
export const DEFAULT_NAME = 'hello';
