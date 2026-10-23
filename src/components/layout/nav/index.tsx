import { useMemo } from 'react';
import { compose } from '@/core/glyphs/compose';
import { toSVG } from '@/core/svg/svg';
import { NavView } from './Nav.view';

/** Top bar: brand mark (drawn by the app's own engine) and credits. */
export function Nav() {
  const brandMarkSvg = useMemo(() => toSVG(compose('h').strokes, { color: '#000', width: 90 }), []);
  return <NavView brandMarkSvg={brandMarkSvg} />;
}
