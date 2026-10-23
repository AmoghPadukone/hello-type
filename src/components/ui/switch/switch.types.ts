import type { ReactNode } from 'react';

export interface SwitchProps {
  label: string;
  hint?: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
