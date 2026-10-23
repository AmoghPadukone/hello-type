import { ColorPicker } from '@/components/ui/color-picker';
import { Field } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { Slider } from '@/components/ui/slider';
import { LIMITS } from '@/settings';
import type { AppearancePanelProps } from './appearance-panel.types';

/** Colour, weight and drawing speed: shared by the previews and every download. */
export function AppearancePanel({ settings, update }: AppearancePanelProps) {
  return (
    <Panel title="Appearance" description="Applies to the previews and every download.">
      <Field label="Colour">
        <ColorPicker value={settings.color} onChange={color => update({ color })} />
      </Field>
      <Field
        label="Weight"
        value={settings.weight}
        hint="Stroke width in Apple’s units — 60 matches the original."
      >
        <Slider
          label="Weight"
          {...LIMITS.weight}
          value={settings.weight}
          onChange={weight => update({ weight })}
        />
      </Field>
      <Field label="Drawing speed" value={`${settings.speed}×`}>
        <Slider
          label="Drawing speed"
          {...LIMITS.speed}
          value={settings.speed}
          onChange={speed => update({ speed })}
        />
      </Field>
    </Panel>
  );
}
