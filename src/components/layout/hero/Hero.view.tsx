import { MODE_COPY } from '@/config/brand';
import { ScriptWord } from '@/components/script-word';
import { ModeTabs } from '../mode-tabs';
import type { HeroProps } from './hero.types';

/** Headline written for the open workspace, with one word drawn in the app's own script. */
export function Hero({ mode, onModeChange }: HeroProps) {
  const copy = MODE_COPY[mode];
  return (
    <header className="flex flex-col gap-6 pt-10 pb-6 sm:pt-14 lg:flex-row lg:items-end lg:justify-between">
      <div key={mode} className="max-w-3xl animate-[fade-in_400ms_ease-out]">
        <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance text-fg sm:text-6xl">
          {copy.before} <ScriptWord text={copy.script} className="text-accent" />
          {copy.after.startsWith('.') ? '' : ' '}
          {copy.after}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-pretty text-fg-muted sm:text-lg">{copy.description}</p>
      </div>
      <ModeTabs mode={mode} onChange={onModeChange} size="lg" />
    </header>
  );
}
