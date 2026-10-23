import { describe, expect, it } from 'vitest';
import { compose, SUPPORTED } from '@/core/glyphs/compose';
import { analyzeJoins } from '@/core/glyphs/quality';
import type { JoinIssue } from '@/core/glyphs/quality.types';

/**
 * Every join between letters must be clean as a 3D tube: no creases inside a stroke and no
 * stroke ends parked beside another stroke (which show as bumps or gaps).
 */

const letters = [...SUPPORTED];
const describeIssues = (word: string, issues: JoinIssue[]) =>
  issues.map(i => `${word}: ${i.type} at (${i.at.map(Math.round).join(', ')}), ${i.amount.toFixed(2)}`);

function problems(words: string[]) {
  return words.flatMap(w => {
    const { strokes, kinds } = compose(w);
    return describeIssues(w, analyzeJoins(strokes, kinds));
  });
}

describe('join quality', () => {
  it('every letter on its own is clean', () => {
    expect(problems(letters)).toEqual([]);
  });

  it('every one of the 676 letter pairs joins cleanly', () => {
    const pairs = letters.flatMap(a => letters.map(b => a + b));
    expect(pairs).toHaveLength(676);
    expect(problems(pairs)).toEqual([]);
  });

  it('real words and phrases are clean', () => {
    expect(
      problems([
        'hello',
        'the quick brown fox jumps over the lazy dog',
        'bonjour',
        'merhaba',
        'quiz',
        'syzygy',
        'bubble',
        'wow',
        'jazz',
        'mississippi',
      ]),
    ).toEqual([]);
  });
});
