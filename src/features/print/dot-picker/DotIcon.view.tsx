import type { ReactNode } from 'react';
import type { DotStyle } from '@/core/print/dots/dots.types';
import { ACCENT, STEM } from './dot-picker.constants';
import type { DotIconProps } from './dot-picker.types';

/** A small sketch of one dot style, for the picker. */
export function DotIcon({ style }: DotIconProps) {
  const dot = (cx = 22.5, cy = 18, fill = 'currentColor') => (
    <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />
  );
  const parts: Record<DotStyle, ReactNode> = {
    teardrop: (
      <>
        <path d="M21 27 C21.5 23 23.5 20 25.5 18" stroke={ACCENT} strokeWidth={3} />
        <circle cx={26.3} cy={17} r={3.6} fill={ACCENT} stroke="none" />
      </>
    ),
    curl: (
      <path
        d="M21 27 C22 21 29.5 20 29.5 15.5 C29.5 11.5 24.5 11 24 14.5 C23.8 16.5 26.5 17 27 15.5"
        stroke={ACCENT}
      />
    ),
    swash: (
      <>
        <path d="M21 27 C18 24 26 22 22.5 18" stroke={ACCENT} strokeWidth={1.6} />
        {dot()}
      </>
    ),
    loop: <path d="M21 27 C19 23 18.5 15 22.5 15 C26.5 15 24.5 23 21 27" stroke={ACCENT} />,
    tether: (
      <>
        <path d="M21 27 L22.5 18" stroke={ACCENT} strokeWidth={1.6} />
        {dot()}
      </>
    ),
    backrod: (
      <>
        <path d="M22.5 18 C29 19 29 27 21 31" stroke={ACCENT} strokeWidth={1.6} strokeDasharray="2.5 2" />
        {dot()}
      </>
    ),
    accent: <path d="M21 27 L25.5 18" stroke={ACCENT} />,
    bead: dot(21, 23.5, ACCENT),
    pin: (
      <>
        {dot(22.5, 15)}
        <path d="M22.5 18.5 L22.3 22.5" stroke={ACCENT} strokeWidth={1.6} />
      </>
    ),
    floating: (
      <>
        {dot()}
        <circle
          cx={22.5}
          cy={18}
          r={6}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeDasharray="1.5 1.5"
          opacity={0.5}
        />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 40 48"
      className="size-10"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      aria-hidden
    >
      <path d={STEM} stroke="currentColor" />
      {parts[style]}
    </svg>
  );
}
