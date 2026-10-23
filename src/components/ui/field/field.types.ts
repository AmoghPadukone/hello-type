import type { ReactNode } from 'react';

export interface FieldProps {
  label: string;
  value?: ReactNode;
  hint?: string;
  children: ReactNode;
}
