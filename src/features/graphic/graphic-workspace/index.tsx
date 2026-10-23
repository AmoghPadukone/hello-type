import { useGraphicExports } from '../hooks/use-graphic-exports';
import type { GraphicWorkspaceProps } from './graphic-workspace.types';
import { GraphicWorkspaceView } from './GraphicWorkspace.view';

/** For people who want the lettering as a graphic: big 2D preview, style, 2D downloads. */
export function GraphicWorkspace({
  settings,
  update,
  composition,
  playKey,
  onReplay,
}: GraphicWorkspaceProps) {
  const { strokes, lengths, svg, empty } = composition;
  const exports = useGraphicExports({
    text: settings.text,
    strokes,
    lengths,
    svg,
    color: settings.color,
    weight: settings.weight,
    speed: settings.speed,
  });
  return (
    <GraphicWorkspaceView
      settings={settings}
      update={update}
      svg={svg}
      empty={empty}
      lengths={lengths}
      playKey={playKey}
      onReplay={onReplay}
      onToggleChecker={() => update({ checker: !settings.checker })}
      exports={exports}
    />
  );
}
