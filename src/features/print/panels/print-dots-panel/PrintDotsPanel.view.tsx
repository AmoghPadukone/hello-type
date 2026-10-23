import { Panel } from '@/components/ui/panel';
import { DotPicker } from '../../dot-picker';
import type { PrintDotsPanelProps } from './print-dots-panel.types';

/** Only shown when the text has i or j: Apple's floating dots need a decision to print. */
export function PrintDotsPanel({ settings, count, onChange }: PrintDotsPanelProps) {
  return (
    <Panel
      title="Dots on i and j"
      description={`Your text has ${count} floating dot${count > 1 ? 's' : ''}. Choose how ${count > 1 ? 'they print' : 'it prints'}.`}
    >
      <DotPicker value={settings.dots} onChange={dots => onChange({ dots })} />
    </Panel>
  );
}
