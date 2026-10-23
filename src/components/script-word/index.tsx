import { useEffect, useMemo, useRef } from 'react';
import { bounds, compose } from '@/core/glyphs/compose';
import { DOT_LENGTH, strokeDuration, strokeLength, toSVG } from '@/core/svg/svg';
import { DOT_FADE_MS, SPEED, START_DELAY_MS, WIDTH, X_HEIGHT, X_HEIGHT_EM } from './script-word.constants';
import type { ScriptWordProps } from './script-word.types';
import { ScriptWordView } from './ScriptWord.view';

/**
 * A word set inline in Hellotype's own script, sitting on the text baseline and drawing
 * itself in once (a small showcase of the product inside its own headline).
 */
export function ScriptWord({ text, className }: ScriptWordProps) {
  const host = useRef<HTMLSpanElement>(null);
  const { svg, height, drop, lengths } = useMemo(() => {
    const { strokes } = compose(text);
    const b = bounds(strokes);
    const pad = WIDTH / 2 + 4;
    const em = X_HEIGHT_EM / X_HEIGHT;
    return {
      svg: toSVG(strokes, { color: 'currentColor', width: WIDTH }).replace(/^<\?xml[^>]*>\s*/, ''),
      height: (b.maxY - b.minY + 2 * pad) * em,
      drop: (0 - (b.minY - pad)) * em,
      lengths: strokes.map(s => strokeLength(s)),
    };
  }, [text]);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let delay = START_DELAY_MS;
    host.current?.querySelectorAll('path').forEach((p, i) => {
      const len = lengths[i] ?? 0;
      const duration = strokeDuration(len, SPEED) * 1000;
      if (len >= DOT_LENGTH) {
        p.style.strokeDasharray = String(len);
        p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration,
          delay,
          fill: 'both',
          easing: 'ease-in-out',
        });
      } else {
        p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DOT_FADE_MS, delay, fill: 'both' });
      }
      delay += duration;
    });
  }, [svg, lengths]);

  return (
    <ScriptWordView hostRef={host} text={text} className={className} svg={svg} height={height} drop={drop} />
  );
}
