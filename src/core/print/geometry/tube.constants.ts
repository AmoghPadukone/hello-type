import type { TubeQuality } from './tube.types';

/** Mesh density for the live preview: light enough to rebuild on every change. */
export const PREVIEW_QUALITY: TubeQuality = { sides: 24, step: 10, capRings: 6 };
/** Mesh density for the exported solid. */
export const PRINT_QUALITY: TubeQuality = { sides: 32, step: 8, capRings: 8 };

/** Turns sharper than this between sample steps split a stroke into separate tubes (cos of 55°). */
export const SHARP = Math.cos((55 * Math.PI) / 180);
/** Max turning per export chunk; below 180° a chunk cannot overlap itself. */
export const CHUNK_TURN = (150 * Math.PI) / 180;
