import { describe, expect, it } from 'vitest';
import { compose } from '@/core/glyphs/compose';
import { samplePieces } from '@/core/print/geometry/tube';
import { DOT_STYLES } from '@/core/print/dots/dots.constants';
import { estimate } from '@/core/print/estimate';
import { printPlan } from '@/core/print/plan';
import { DEFAULT_PRINT, normalizePrint, PRINT_LIMITS } from '@/core/print/settings';

const planFor = (text: string, print = {}) => {
  const c = compose(text);
  return printPlan(c.strokes, c.kinds, 60, { ...DEFAULT_PRINT, orientation: 'stand', ...print });
};

describe('normalizePrint', () => {
  it('clamps out-of-range and non-numeric values', () => {
    const s = normalizePrint({
      widthMM: 0,
      thickness: Number.NaN,
      feetMM: -3,
      orientation: 'sideways' as never,
    });
    expect(s.widthMM).toBe(PRINT_LIMITS.widthMM.min);
    expect(s.thickness).toBe(DEFAULT_PRINT.thickness);
    expect(s.feetMM).toBe(PRINT_LIMITS.feetMM.min);
    expect(s.orientation).toBe('flat');
  });
});

describe('printPlan', () => {
  it('returns null when there is nothing to print', () => {
    expect(planFor('')).toBeNull();
  });

  it('scales to the requested width', () => {
    const plan = planFor('hello', { widthMM: 150 })!;
    expect((plan.metrics.maxX - plan.metrics.minX) * plan.s).toBeCloseTo(150, 6);
  });

  it('cuts standing pieces just above the baseline feet', () => {
    const plan = planFor('hello', { feetMM: 2 })!;
    expect(plan.cut?.axis).toBe(1);
    expect((plan.cut!.at - plan.metrics.footY) * plan.s).toBeCloseTo(2, 6);
    expect(plan.plate).toBeNull();
  });

  it('puts the plate at the baseline so every word stands on it', () => {
    const plan = planFor('hello', { base: 'plate' })!;
    // Plate top is just above the baseline feet; the cut removes only what's below the plate.
    expect(plan.plate!.max[1]).toBeGreaterThan(plan.metrics.footY);
    expect(plan.cut!.at).toBeCloseTo(plan.plate!.min[1], 6);
  });

  it('stands words with descenders on their loops, kept whole', () => {
    const { metrics: m, cut, s } = planFor('amogh')!;
    expect(m.hasDescenders).toBe(true);
    expect((cut!.at - m.lowY) * s).toBeCloseTo(DEFAULT_PRINT.feetMM, 6);
    const plated = planFor('amogh', { base: 'plate' })!;
    expect(plated.plate!.max[1]).toBeLessThan(m.footY);
    expect(plated.plate!.max[1]).toBeLessThan(m.lowY + 2.5 / plated.s);
  });

  it('sizes the plate in mm, independent of the text width', () => {
    for (const widthMM of [40, 200]) {
      const plan = planFor('hello', { base: 'plate', widthMM, plateMM: 3, plateMarginMM: 6 })!;
      const { plate, metrics: m, s } = plan;
      expect((plate!.max[1] - plate!.min[1]) * s).toBeCloseTo(3, 6);
      expect((m.minX - plate!.min[0]) * s).toBeCloseTo(6, 6);
      expect((plate!.max[0] - m.maxX) * s).toBeCloseTo(6, 6);
    }
  });

  it('finds the feet at baseline low points, not where descenders pass through', () => {
    const jo = planFor('jo')!;
    const o = planFor('o')!;
    expect(Math.abs(jo.metrics.footY - o.metrics.footY)).toBeLessThan(20);
  });

  it('joins every i/j dot to the word for each connected dot style', () => {
    for (const style of DOT_STYLES.filter(s => s.connected)) {
      const plan = planFor('hi', { dots: style.id })!;
      expect(plan.dots).toBe(1);
      const pen = plan.strokes.slice(0, 2).flatMap(s => samplePieces(s, plan.radiusScale, 10).flat());
      const marks = plan.strokes.slice(2).flatMap(s => samplePieces(s, plan.radiusScale, 10).flat());
      // Every mark tube is connected: some mark sample overlaps the word.
      const gap = Math.min(
        ...marks.flatMap(m =>
          pen.map(p => Math.hypot(p.c[0] - m.c[0], p.c[1] - m.c[1], p.c[2] - m.c[2]) - p.r - m.r),
        ),
      );
      expect(gap, style.id).toBeLessThan(0);
    }
  });

  it('keeps pin dots out of the solid but in the preview', () => {
    const plan = planFor('hi', { dots: 'pin' })!;
    expect(plan.pins).toHaveLength(1);
    expect(plan.previewOnly).toHaveLength(1);
    expect(estimate(plan).warnings.join(' ')).toMatch(/peg/);
  });

  it('warns that floating dots print loose', () => {
    expect(estimate(planFor('hi', { dots: 'floating' })!).warnings.join(' ')).toMatch(/loose/);
  });

  it('warns that letters hang above descender loops', () => {
    expect(estimate(planFor('jumping')!).warnings.join(' ')).toMatch(/hang above/);
    expect(estimate(planFor('hello')!).warnings).toEqual([]);
  });
});
