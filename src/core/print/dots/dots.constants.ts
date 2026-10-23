import type { DotStyle, DotStyleInfo } from './dots.types';

/** Every dot style, in the order the picker shows them. The copy is shown in the UI as is. */
export const DOT_STYLES: readonly DotStyleInfo[] = [
  {
    id: 'teardrop',
    label: 'Teardrop',
    description: 'The stem flicks up and swells into the dot.',
    connected: true,
  },
  {
    id: 'curl',
    label: 'Curl',
    description: 'The stem keeps going and winds into a little spiral.',
    connected: true,
  },
  {
    id: 'swash',
    label: 'Swash',
    description: 'The dot stays put, joined by a wavy thread.',
    connected: true,
  },
  {
    id: 'loop',
    label: 'Loop',
    description: 'A small pen loop above the stem stands in for the dot.',
    connected: true,
  },
  {
    id: 'tether',
    label: 'Tether',
    description: 'The dot stays put, joined by a straight fine rod.',
    connected: true,
  },
  {
    id: 'backrod',
    label: 'Back rod',
    description: 'Looks original from the front; a rod joins it from behind.',
    connected: true,
  },
  {
    id: 'accent',
    label: 'Accent',
    description: 'The dot becomes a short slanted stroke on the stem.',
    connected: true,
  },
  { id: 'bead', label: 'Bead', description: 'The dot drops onto the stem top. Strongest.', connected: true },
  {
    id: 'pin',
    label: 'Pin & socket',
    description: 'Exact original: print the dot apart and glue it in.',
    connected: false,
  },
  {
    id: 'floating',
    label: 'Floating',
    description: 'Exactly as designed; the dot prints as a loose piece.',
    connected: false,
  },
];

export const DEFAULT_DOT_STYLE: DotStyle = 'teardrop';

/** Fine rods and threads are at least this thick when printed. */
export const MIN_ROD_MM = 1.3;
/** Marks are pulled in until their tube overlaps the word by this share of the radii. */
export const MARK_OVERLAP = 0.6;
