import { useMemo } from 'react';
import { compose } from '@/core/glyphs/compose';
import { strokeLength, toSVG } from '@/core/svg/svg';

/**
 * The text as strokes, plus what both workspaces derive from them: per-stroke lengths (draw
 * timing) and the 2D SVG. Each piece recomputes only when its own inputs change.
 */
export function useComposedText(text: string, color: string, weight: number) {
  const { strokes, kinds, skipped } = useMemo(() => compose(text), [text]);
  const lengths = useMemo(() => strokes.map(s => strokeLength(s)), [strokes]);
  const svg = useMemo(() => toSVG(strokes, { color, width: weight }), [strokes, color, weight]);
  return { strokes, kinds, skipped, lengths, svg, empty: strokes.length === 0 };
}

export type ComposedText = ReturnType<typeof useComposedText>;
