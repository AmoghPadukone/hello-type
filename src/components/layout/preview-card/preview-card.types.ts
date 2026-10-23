import type { ReactNode } from 'react';

export interface PreviewCardProps {
  label: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}
