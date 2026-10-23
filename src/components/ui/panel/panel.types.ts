import type { ReactNode } from 'react';

export interface PanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}
