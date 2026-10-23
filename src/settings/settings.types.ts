import type { PrintSettings } from '@/core/print/plan.types';

/** Which workspace is open: a 2D graphic (SVG/PNG) or a 3D print (3MF/STL). */
export type Mode = 'graphic' | 'print';

/** Everything the user can change. Persisted to localStorage; `?text=` and `#print` override. */
export interface Settings {
  mode: Mode;
  text: string;
  /** Ink colour for previews and every download. */
  color: string;
  /** Stroke weight in glyph units (60 = Apple's). */
  weight: number;
  /** Drawing speed multiplier. */
  speed: number;
  /** Show a transparency checkerboard behind the 2D preview. */
  checker: boolean;
  print: PrintSettings;
}

/** A partial update; `print` is merged into the current print settings rather than replacing them. */
export type SettingsPatch = Partial<Omit<Settings, 'print'>> & { print?: Partial<PrintSettings> };

export type UpdateSettings = (patch: SettingsPatch) => void;
