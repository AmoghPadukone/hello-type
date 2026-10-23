import { useState } from 'react';
import { DEBOUNCE_MS } from '@/config/constants';
import { useDebouncedValue } from './use-debounced-value';

/**
 * A token that changes whenever the drawing should replay: on load, once typing pauses, on
 * Replay, and when switching workspace. Previews restart their draw-on animation when it changes.
 */
export function useReplay(text: string, mode: string) {
  const [replays, setReplays] = useState(0);
  const settledText = useDebouncedValue(text, DEBOUNCE_MS.replay);
  return {
    playKey: `${replays}:${mode}:${settledText}`,
    replay: () => setReplays(n => n + 1),
  };
}
