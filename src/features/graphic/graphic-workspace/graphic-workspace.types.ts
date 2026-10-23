import type { ComposedText } from '@/hooks/use-composed-text';
import type { Settings, UpdateSettings } from '@/settings';
import type { GraphicExports } from '../graphic.types';

export interface GraphicWorkspaceProps {
  settings: Settings;
  update: UpdateSettings;
  composition: ComposedText;
  /** Changing this replays the draw-on animation. */
  playKey: string;
  onReplay: () => void;
}

export interface GraphicWorkspaceViewProps extends Omit<GraphicWorkspaceProps, 'composition'> {
  svg: string;
  empty: boolean;
  lengths: readonly number[];
  exports: GraphicExports;
  onToggleChecker: () => void;
}
