import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compose } from '@/core/glyphs/compose';
import { centreline } from '@/core/glyphs/quality';
import type { Point, Stroke } from '@/core/types';

/**
 * Fidelity to Apple's lettering: composing Apple's own "hello" words with Hellotype's glyphs
 * must stay close to Apple's original strokes. The metric is the mean distance (glyph units;
 * the tube radius is ~30) from each point of Apple's centreline to the nearest point of ours,
 * after the best horizontal alignment. Bounds sit a little above today's values, so a change
 * that bends letters or spacing away from Apple's fails here. Run it after any change to glyphs or spacing.
 */

const WORDS: [lang: string, word: string, maxMean: number][] = [
  ['tr', 'merhaba', 18],
  ['ms', 'helo', 15],
  ['it', 'ciao', 22],
  ['en', 'hello', 23],
  ['es', 'hola', 24],
  ['fr', 'bonjour', 28],
  ['cs', 'ahoj', 28],
  ['id', 'halo', 28],
  ['fi', 'hei', 30],
  ['ro', 'salut', 33],
  ['hr', 'dobar dan', 36],
  ['da', 'hej', 40],
  ['de', 'hallo', 42],
];

function apple(lang: string): Stroke[] {
  const data = JSON.parse(readFileSync(`data/source/hello-${lang}.json`, 'utf8')) as {
    strokes: Record<'p0' | 'p1' | 'p2' | 'p3', number[]>[][];
  };
  return data.strokes.map(s =>
    s.map(g => (['p0', 'p1', 'p2', 'p3'] as const).map(k => g[k].slice(0, 4) as Point) as Stroke[number]),
  );
}

function meanDeviation(lang: string, word: string): number {
  const a = centreline(apple(lang))
    .map(c => c.p)
    .filter((_, i) => i % 2 === 0);
  const o = centreline(compose(word).strokes)
    .map(c => c.p)
    .filter((_, i) => i % 2 === 0);
  let best = Infinity;
  for (let dx = -400; dx <= 400; dx += 20) {
    const m =
      a.reduce((s, p) => s + Math.min(...o.map(q => Math.hypot(q[0] + dx - p[0], q[1] - p[1]))), 0) /
      a.length;
    best = Math.min(best, m);
  }
  return best;
}

describe('fidelity to Apple’s originals', () => {
  for (const [lang, word, maxMean] of WORDS) {
    it(`${word} (${lang}) stays within ${maxMean} units`, { timeout: 30000 }, () => {
      expect(meanDeviation(lang, word)).toBeLessThan(maxMean);
    });
  }
});
