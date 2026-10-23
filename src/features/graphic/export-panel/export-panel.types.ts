import type { ReactNode } from 'react';
import type { GraphicExports } from '../graphic.types';

export interface ExportPanelProps extends GraphicExports {
  disabled: boolean;
}

export interface ExportRowProps {
  icon: ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}
