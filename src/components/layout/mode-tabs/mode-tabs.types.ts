import type { Mode } from '@/settings';

export interface ModeTabsProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  /** `sm` in the nav, `lg` in the hero. */
  size?: 'sm' | 'lg';
}
