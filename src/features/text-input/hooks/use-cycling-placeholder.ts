import { useEffect, useState } from 'react';
import { EXAMPLES } from '@/config/brand';
import { PLACEHOLDER_INTERVAL_MS } from '@/config/constants';
import { shuffled } from '@/utils/array';

/** While `active` (the box is empty), cycles through the examples in shuffled order. */
export function useCyclingPlaceholder(active: boolean) {
  const [order] = useState(() => shuffled(EXAMPLES));
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI(n => (n + 1) % order.length), PLACEHOLDER_INTERVAL_MS);
    return () => clearInterval(t);
  }, [active, order]);
  return `Try “${order[i]}”…`;
}
