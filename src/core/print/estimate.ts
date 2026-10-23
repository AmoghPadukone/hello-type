/**
 * Approximate finished size and print warnings, from the plan alone (no meshing), so the print
 * panel can update on every change. The real size comes back from the CSG export.
 */
import type { PrintEstimate, PrintPlan } from './plan.types';

export function estimate(plan: PrintPlan): PrintEstimate {
  const { metrics: m, s } = plan;
  const bottom = plan.cut?.axis === 1 ? plan.cut.at : m.lowY;
  const widthMM = plan.plate ? (plan.plate.max[0] - plan.plate.min[0]) * s : (m.maxX - m.minX) * s;
  const heightMM = (m.maxY - bottom) * s;
  const depthMM = plan.plate ? (plan.plate.max[2] - plan.plate.min[2]) * s : (m.maxZ - m.minZ) * s;
  const tubeMM = 60 * plan.radiusScale * s;
  const warnings: string[] = [];
  if (tubeMM < 1.6) warnings.push('The tube is thin for FDM printing — make it wider or thicker.');
  if (plan.orientation === 'stand' && m.hasDescenders)
    warnings.push(
      'The word stands on its descender loops (g j p q y f); the other letters hang above — use tree supports under them.',
    );
  // A standing piece needs its footprint depth to be a fair share of its height.
  if (plan.orientation === 'stand' && !plan.plate && depthMM / heightMM < 0.15)
    warnings.push('It may tip over — use a base plate, or more thickness or depth.');
  if (plan.dots && plan.dotStyle === 'floating')
    warnings.push(
      `${plan.dots === 1 ? 'The dot prints' : `${plan.dots} dots print`} as loose pieces — pick a connected dot style to keep it one piece.`,
    );
  if (plan.dots && plan.dotStyle === 'pin')
    warnings.push(
      `${plan.dots === 1 ? 'The dot is' : `${plan.dots} dots are`} exported beside the word with a peg — glue into the socket after printing.`,
    );
  return { widthMM, heightMM, depthMM, tubeMM, warnings };
}
