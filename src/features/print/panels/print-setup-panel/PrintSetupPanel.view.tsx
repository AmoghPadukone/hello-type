import { Box, RectangleHorizontal } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { Field } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PRINT_LIMITS } from '@/core/print/settings';
import type { PrintSetupPanelProps } from './print-setup-panel.types';

/** Size, orientation, feet or base plate, thickness and depth. */
export function PrintSetupPanel({ settings, color, onChange, onColor }: PrintSetupPanelProps) {
  const stand = settings.orientation === 'stand';
  return (
    <Panel title="Print setup" description="Sized in millimetres, exported as one watertight solid.">
      <Segmented
        label="Orientation"
        value={settings.orientation}
        onChange={orientation => onChange({ orientation })}
        options={[
          {
            value: 'stand',
            label: (
              <>
                <Box className="size-3.5" /> Standing
              </>
            ),
          },
          {
            value: 'flat',
            label: (
              <>
                <RectangleHorizontal className="size-3.5" /> Lying flat
              </>
            ),
          },
        ]}
      />
      <Field
        label="Text width"
        value={`${settings.widthMM} mm`}
        hint="Width of the lettering alone. A base plate adds its own margin around it."
      >
        <Slider
          label="Text width"
          {...PRINT_LIMITS.widthMM}
          value={settings.widthMM}
          onChange={widthMM => onChange({ widthMM })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Thickness"
          value={`${settings.thickness.toFixed(2)}×`}
          hint="Tube thickness relative to Apple’s proportions. Thicker prints sturdier."
        >
          <Slider
            label="Thickness"
            {...PRINT_LIMITS.thickness}
            value={settings.thickness}
            onChange={thickness => onChange({ thickness })}
          />
        </Field>
        <Field
          label="Depth"
          value={`${Math.round(settings.depth * 100)}%`}
          hint="How far loops swing in front of and behind each other. 100% is Apple’s; lower fuses crossings for a stronger, more compact piece."
        >
          <Slider
            label="Depth"
            {...PRINT_LIMITS.depth}
            value={settings.depth}
            onChange={depth => onChange({ depth })}
          />
        </Field>
      </div>
      {stand ? (
        <>
          <Field
            label="Feet cut"
            value={`${settings.feetMM} mm`}
            hint="How much is sliced off the bottom to give each letter touching the desk a flat foot."
          >
            <Slider
              label="Feet cut"
              {...PRINT_LIMITS.feetMM}
              value={settings.feetMM}
              onChange={feetMM => onChange({ feetMM })}
            />
          </Field>
          <Switch
            label="Add base plate"
            hint="Words with g j p q y f need a base plate: flat feet would trim their loops."
            description="A slim slab under the word that joins every letter."
            checked={settings.base === 'plate'}
            onChange={on => onChange({ base: on ? 'plate' : 'feet' })}
          />
          {settings.base === 'plate' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Plate thickness" value={`${settings.plateMM} mm`}>
                <Slider
                  label="Plate thickness"
                  {...PRINT_LIMITS.plateMM}
                  value={settings.plateMM}
                  onChange={plateMM => onChange({ plateMM })}
                />
              </Field>
              <Field
                label="Plate margin"
                value={`${settings.plateMarginMM} mm`}
                hint="How far the plate reaches past the letters on every side."
              >
                <Slider
                  label="Plate margin"
                  {...PRINT_LIMITS.plateMarginMM}
                  value={settings.plateMarginMM}
                  onChange={plateMarginMM => onChange({ plateMarginMM })}
                />
              </Field>
            </div>
          )}
        </>
      ) : (
        <Field
          label="Flatten back"
          value={settings.flatBack ? `${Math.round(settings.flatBack * 100)}%` : 'Round'}
          hint="Shave the back flat so it prints without supports. 0 keeps the tube fully round."
        >
          <Slider
            label="Flatten back"
            {...PRINT_LIMITS.flatBack}
            value={settings.flatBack}
            onChange={flatBack => onChange({ flatBack })}
          />
        </Field>
      )}
      <Field label="Preview colour" hint="Only colours the preview — the print takes your filament’s colour.">
        <ColorPicker value={color} onChange={onColor} />
      </Field>
    </Panel>
  );
}
