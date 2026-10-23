import { GLYPHS } from '@/core/glyphs/compose';
import type { SolidResult } from '@/core/print/csg/solid.types';
import type { PrintPlan } from '@/core/print/plan.types';
import { formatMM } from '@/utils/format';

/** The status line after an export: real size, what it stands on, volume, and any piece-count notes. */
export function exportSummary(solid: SolidResult, plan: PrintPlan, text: string, fileName: string) {
  const [x, y, z] = solid.size.map(formatMM);
  const base =
    plan.orientation === 'stand'
      ? plan.plate
        ? ', on its base plate'
        : `, standing on ${solid.footprint.count} flat ${solid.footprint.count === 1 ? 'foot' : 'feet'}`
      : '';
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => [...w].some(c => c in GLYPHS)).length;
  const notes: string[] = [];
  // More bodies than words means a word fell apart; one body per word is expected without a plate.
  if (solid.bodies > words)
    notes.push(`The word has ${solid.bodies} separate pieces; check it in your slicer.`);
  else if (solid.bodies > 1) notes.push('Each word prints as its own piece — use a base plate to join them.');
  if (solid.pinParts)
    notes.push(`${solid.pinParts} dot${solid.pinParts > 1 ? 's' : ''} with pegs sit beside the word.`);
  return {
    message: `Saved ${fileName} — ${x} × ${y} mm on the bed, ${z} mm tall${base}, ${(solid.volumeMM3 / 1000).toFixed(1)} cm³.`,
    note: notes.join(' ') || undefined,
  };
}
