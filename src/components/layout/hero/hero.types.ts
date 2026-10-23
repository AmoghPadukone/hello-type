import type { Mode } from '@/settings';

export interface HeroProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}
