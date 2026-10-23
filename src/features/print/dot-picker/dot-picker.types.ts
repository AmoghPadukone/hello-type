import type { DotStyle } from '@/core/print/dots/dots.types';

export interface DotPickerProps {
  value: DotStyle;
  onChange: (style: DotStyle) => void;
}

export interface DotIconProps {
  style: DotStyle;
}
