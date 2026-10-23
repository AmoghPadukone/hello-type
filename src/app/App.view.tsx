import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/layout/hero';
import { Nav } from '@/components/layout/nav';
import { GraphicWorkspace } from '@/features/graphic/graphic-workspace';
import { PrintWorkspace } from '@/features/print/print-workspace';
import { TextBar } from '@/features/text-input/text-bar';
import type { AppViewProps } from './app.types';

/** Page layout: nav, hero, the shared text box, then the open workspace. */
export function AppView({
  settings,
  update,
  composition,
  playKey,
  onReplay,
  onModeChange,
  onTextChange,
}: AppViewProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <Nav />
      <Hero mode={settings.mode} onModeChange={onModeChange} />
      <main className="space-y-4">
        <TextBar value={settings.text} skipped={composition.skipped} onChange={onTextChange} />
        {settings.mode === 'graphic' ? (
          <GraphicWorkspace
            settings={settings}
            update={update}
            composition={composition}
            playKey={playKey}
            onReplay={onReplay}
          />
        ) : (
          <PrintWorkspace
            settings={settings}
            update={update}
            strokes={composition.strokes}
            kinds={composition.kinds}
            playKey={playKey}
            onReplay={onReplay}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
