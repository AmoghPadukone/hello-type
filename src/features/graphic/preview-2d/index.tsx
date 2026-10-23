import { useEffect, useRef } from 'react';
import { DOT_LENGTH, strokeDuration } from '@/core/svg/svg';
import type { Preview2DProps } from './preview-2d.types';
import { Preview2DView } from './Preview2D.view';

export function Preview2D({ lengths, speed, playKey, ...view }: Preview2DProps) {
  const host = useRef<HTMLDivElement>(null);

  // Draw the strokes on one after another. Each stays hidden until its turn so round caps
  // don't show as dots ahead of the pen.
  useEffect(() => {
    let delay = 0;
    host.current?.querySelectorAll('path').forEach((p, i) => {
      const len = lengths[i] ?? p.getTotalLength();
      const duration = strokeDuration(len, speed) * 1000;
      p.getAnimations().forEach(a => a.cancel());
      if (len >= DOT_LENGTH) {
        p.style.strokeDasharray = String(len);
        p.animate(
          [
            { strokeDashoffset: len, visibility: 'visible' },
            { strokeDashoffset: 0, visibility: 'visible' },
          ],
          { duration, delay, fill: 'both', easing: 'linear' },
        );
      }
      if (delay) p.animate([{ visibility: 'hidden' }, { visibility: 'hidden' }], { duration: delay });
      delay += duration;
    });
    // Replays only on demand; re-renders while typing show the finished word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  return <Preview2DView hostRef={host} {...view} />;
}
