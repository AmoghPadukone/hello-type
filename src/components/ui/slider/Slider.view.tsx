import * as RadixSlider from '@radix-ui/react-slider';
import type { SliderProps } from './slider.types';

export function Slider({ value, min, max, step, onChange, label }: SliderProps) {
  return (
    <RadixSlider.Root
      className="relative flex h-5 w-full touch-none items-center select-none"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
    >
      <RadixSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-white/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label={label}
        className="block size-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </RadixSlider.Root>
  );
}
