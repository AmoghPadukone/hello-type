import { useEffect, useState, type RefObject } from 'react';
import type { PrintPlan } from '@/core/print/plan.types';
import type { Viewer } from '@/viewer/viewer';

/**
 * Mounts the three.js viewer into `host` and keeps it in sync. three.js is code-split (this
 * dynamic import is the only way it is loaded), so the 2D tool works even without WebGL.
 */
export function useViewer(
  host: RefObject<HTMLDivElement | null>,
  plan: PrintPlan | null,
  color: string,
  speed: number,
  playKey: string,
) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let instance: Viewer | null = null;
    import('@/viewer/viewer')
      .then(({ Viewer }) => {
        if (disposed || !host.current) return;
        instance = new Viewer(host.current);
        setViewer(instance);
      })
      .catch(err => {
        console.error(err);
        setFailed(true);
      });
    return () => {
      disposed = true;
      instance?.dispose();
    };
  }, [host]);

  useEffect(() => viewer?.setColor(color), [viewer, color]);
  useEffect(() => viewer?.setPlan(plan, speed), [viewer, plan, speed]);
  useEffect(() => {
    viewer?.play();
  }, [viewer, playKey]);

  return { viewer, failed };
}
