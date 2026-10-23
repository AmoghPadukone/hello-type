import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Box, PenTool } from 'lucide-react';
import { MODE_COPY } from '@/config/brand';
import type { Mode } from '@/settings';
import type { ModeTabsProps } from './mode-tabs.types';

const MODE_ICONS = { graphic: PenTool, print: Box } as const;

/** The two workspaces, as tabs. */
export function ModeTabs({ mode, onChange, size = 'sm' }: ModeTabsProps) {
  const large = size === 'lg';
  return (
    <ToggleGroup.Root
      type="single"
      value={mode}
      onValueChange={v => v && onChange(v as Mode)}
      aria-label="What are you making?"
      className={
        large
          ? 'grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[440px]'
          : 'flex gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-white/[0.07]'
      }
    >
      {(Object.keys(MODE_COPY) as Mode[]).map(m => {
        const Icon = MODE_ICONS[m];
        return (
          <ToggleGroup.Item
            key={m}
            value={m}
            className={
              large
                ? 'group flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left ring-1 ring-white/[0.07] transition hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-accent data-[state=on]:bg-accent/[0.12] data-[state=on]:ring-accent/50'
                : 'flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-accent data-[state=on]:bg-white/[0.12] data-[state=on]:text-fg'
            }
          >
            {large ? (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-fg-muted group-data-[state=on]:bg-accent group-data-[state=on]:text-white">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-fg">{MODE_COPY[m].tab}</span>
                  <span className="block text-xs text-fg-subtle">{MODE_COPY[m].formats}</span>
                </span>
              </>
            ) : (
              <>
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{MODE_COPY[m].tab}</span>
              </>
            )}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
