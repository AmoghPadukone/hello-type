import { useComposedText } from '@/hooks/use-composed-text';
import { useReplay } from '@/hooks/use-replay';
import { useSettings } from '@/settings';
import { AppView } from './App.view';

/**
 * Root controller. Holds the settings and the composed text, which both workspaces share;
 * everything workspace-specific (exports, the print plan) lives in that workspace.
 */
export function App() {
  const [settings, update] = useSettings();
  const composition = useComposedText(settings.text, settings.color, settings.weight);
  const { playKey, replay } = useReplay(settings.text, settings.mode);
  return (
    <AppView
      settings={settings}
      update={update}
      composition={composition}
      playKey={playKey}
      onReplay={replay}
      onModeChange={mode => update({ mode })}
      onTextChange={text => update({ text })}
    />
  );
}
