import { DEFAULT_PRINT } from '@/core/print/settings';
import type { Settings } from './settings.types';

export const DEFAULT_SETTINGS: Settings = {
  mode: 'graphic',
  text: 'hello',
  color: '#f5f5f7',
  weight: 60,
  speed: 1,
  checker: false,
  print: DEFAULT_PRINT,
};
