import { describe, expect, it } from 'vitest';
import { compose, GLYPHS, SUPPORTED } from '@/core/glyphs/compose';
import { strokeLength, toSVG } from '@/core/svg/svg';

describe('compose', () => {
  it('has a glyph for every lowercase letter', () => {
    expect(SUPPORTED).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('composes every letter into finite strokes', () => {
    for (const ch of Object.keys(GLYPHS)) {
      const { strokes } = compose(`a${ch}a ${ch}`);
      expect(strokes.length).toBeGreaterThan(0);
      for (const s of strokes)
        for (const seg of s) for (const p of seg) expect(p.every(Number.isFinite)).toBe(true);
    }
  });

  it('keeps strokes continuous: every segment starts where the previous one ends', () => {
    const { strokes } = compose('the quick brown fox jumps over the lazy dog');
    for (const s of strokes) {
      for (let i = 1; i < s.length; i++) {
        const [x0, y0] = s[i - 1][3];
        const [x1, y1] = s[i][0];
        expect(Math.hypot(x1 - x0, y1 - y0)).toBeLessThan(0.01);
      }
    }
  });

  it('reports unsupported characters and is case-insensitive', () => {
    const r = compose('Hi 2U!');
    expect(r.skipped).toEqual(['2', '!']);
    expect(r.strokes.length).toBeGreaterThan(0);
  });

  it('tags dots and crossbars as marks', () => {
    const { kinds } = compose('it');
    expect(kinds.filter(k => k === 'mark')).toHaveLength(2); // i dot, t crossbar
    expect(kinds.lastIndexOf('pen')).toBeLessThan(kinds.indexOf('mark'));
  });

  it('returns nothing for empty or unsupported text', () => {
    expect(compose('').strokes).toEqual([]);
    expect(compose('123').strokes).toEqual([]);
  });
});

describe('toSVG', () => {
  it('produces convert.py-shaped SVG with a flipped group', () => {
    const svg = toSVG(compose('hello').strokes, { color: '#123456' });
    expect(svg).toMatch(/^<\?xml version="1\.0" \?>/);
    expect(svg).toContain('scale(1, -1)');
    expect(svg).toContain('stroke="#123456"');
    expect(svg).toContain('stroke-linecap="round"');
  });

  it('adds draw-on animation timing when animated', () => {
    const { strokes } = compose('hi');
    const svg = toSVG(strokes, { animate: true, lengths: strokes.map(s => strokeLength(s)) });
    expect(svg).toContain('@keyframes draw');
    expect(svg.match(/animation-delay/g)?.length).toBeGreaterThan(1);
    expect(svg).toContain('class="dot"'); // the i dot pops in rather than dash-animating
  });

  it('escapes the colour attribute', () => {
    expect(toSVG(compose('a').strokes, { color: '"><script>' })).not.toContain('<script>');
  });
});
