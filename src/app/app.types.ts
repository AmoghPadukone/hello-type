import type { ComposedText } from '@/hooks/use-composed-text';
import type { Mode, Settings, UpdateSettings } from '@/settings';

export interface AppViewProps {
  settings: Settings;
  update: UpdateSettings;
  composition: ComposedText;
  playKey: string;
  onReplay: () => void;
  onModeChange: (mode: Mode) => void;
  onTextChange: (text: string) => void;
}
