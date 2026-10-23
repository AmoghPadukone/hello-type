/**
 * The print plan: everything the 3D preview and the exporter must agree on, in glyph units
 * (depth scale, attached marks, mm scale, cut line, base plate). Pure and synchronous, so it
 * can run on every keystroke and inside the export worker.
 */
import type { Stroke, StrokeKind } from '@/core/types';
import { applyDots } from './dots/dots';
import { PREVIEW_QUALITY } from './geometry/tube.constants';
import { samplePieces } from './geometry/tube';
import type { PrintPlan, PrintSettings, StandMetrics } from './plan.types';
import { normalizePrint } from './settings';

/** Glyph units above the lowest foot that still count as a baseline foot. */
const FOOT_BAND = 40;
const PLATE_MM = { overlap: 0.4, minDepthRatio: 0.2 };
/** Pen low points below this are descender loops (g j p q y f), not baseline feet. */
const DESCENDER_Y = -60;

const withDepth = (strokes: readonly Stroke[], k: number): Stroke[] =>
  strokes.map(s => s.map(seg => seg.map(([x, y, z, r]) => [x, y, z * k, r]) as Stroke[number]));

function samples(stroke: Stroke, radiusScale: number) {
  return samplePieces(stroke, radiusScale, PREVIEW_QUALITY.step).flat();
}

function standMetrics(strokes: readonly Stroke[], radiusScale: number): StandMetrics {
  const m = {
    footY: Infinity,
    footTopY: -Infinity,
    lowY: Infinity,
    maxY: -Infinity,
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  };
  const feet: number[] = [];
  for (const stroke of strokes) {
    const pts = samples(stroke, radiusScale);
    pts.forEach(({ c, r }, i) => {
      // Feet are where the pen bottoms out (local minima), not where a descender merely
      // passes through the baseline zone on its way down.
      const lower = (j: number) => j < 0 || j >= pts.length || pts[j].c[1] >= c[1];
      if (c[1] > DESCENDER_Y && lower(i - 1) && lower(i + 1)) {
        m.footY = Math.min(m.footY, c[1] - r);
        feet.push(c[1] - r);
      }
      m.lowY = Math.min(m.lowY, c[1] - r);
      m.maxY = Math.max(m.maxY, c[1] + r);
      m.minX = Math.min(m.minX, c[0] - r);
      m.maxX = Math.max(m.maxX, c[0] + r);
      m.minZ = Math.min(m.minZ, c[2] - r);
      m.maxZ = Math.max(m.maxZ, c[2] + r);
    });
  }
  // Only minima near the lowest foot count: inner turns (e's eye, h's arch) sit far higher and aren't feet.
  for (const f of feet) if (f <= m.footY + FOOT_BAND) m.footTopY = Math.max(m.footTopY, f);
  if (!Number.isFinite(m.footY)) m.footTopY = m.footY = m.lowY;
  return { ...m, hasDescenders: m.lowY < m.footY - 1 };
}

export function printPlan(
  strokes: readonly Stroke[],
  kinds: readonly StrokeKind[],
  /** 2D stroke weight (60 = Apple's); the tube scales with it. */
  weight: number,
  settings: PrintSettings,
): PrintPlan | null {
  if (!strokes.length) return null;
  const set = normalizePrint(settings);
  const radiusScale = (weight / 60) * set.thickness;
  const deep = withDepth(strokes, set.depth);
  // The word's width (pen strokes) fixes the mm scale; dot styles need it for minimum rod size.
  const pen = standMetrics(
    deep.filter((_, i) => kinds[i] === 'pen'),
    radiusScale,
  );
  const dots = applyDots(deep, kinds, radiusScale, set.widthMM / (pen.maxX - pen.minX), set.dots);
  const m = standMetrics([...dots.strokes, ...dots.previewOnly], radiusScale);
  const s = set.widthMM / (m.maxX - m.minX);
  const plan: PrintPlan = {
    strokes: dots.strokes,
    radiusScale,
    s,
    metrics: m,
    orientation: set.orientation,
    cut: null,
    plate: null,
    previewOnly: dots.previewOnly,
    pins: dots.pins,
    dotStyle: set.dots,
    dots: dots.dots,
  };

  if (set.orientation === 'stand') {
    // Letters stand on the baseline feet. A plate sits right there too, so every word stands
    // on it; descender loops sink into it and are trimmed flush with its underside.
    const feetY = m.footY + set.feetMM / s;
    plan.cut = { axis: 1, at: feetY };
    if (set.base === 'plate') {
      const midZ = (m.minZ + m.maxZ) / 2;
      // Plate size is set directly in mm, independent of the text width, so resizing the word
      // never makes the plate look thicker or thinner relative to it.
      const pl = { thickness: set.plateMM, margin: set.plateMarginMM, round: set.plateMM * 0.35 };
      const d = Math.max(m.maxZ - m.minZ + (2 * pl.margin) / s, PLATE_MM.minDepthRatio * (m.maxY - feetY));
      // Feet are not all equally low; the plate must reach the highest one so no letter floats.
      const top = Math.max(feetY, m.footTopY) + PLATE_MM.overlap / s;
      const bottom = top - pl.thickness / s;
      plan.cut = { axis: 1, at: bottom };
      plan.plate = {
        min: [m.minX - pl.margin / s, bottom, midZ - d / 2],
        max: [m.maxX + pl.margin / s, top, midZ + d / 2],
        round: pl.round / s,
      };
    }
  } else if (set.flatBack > 0) {
    plan.cut = { axis: 2, at: m.minZ + set.flatBack * 30 * radiusScale };
  }
  return plan;
}
