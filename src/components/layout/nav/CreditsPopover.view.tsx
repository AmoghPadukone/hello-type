import * as Popover from '@radix-ui/react-popover';
import { ArrowUpRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CREDITS } from '@/config/brand';
import { CREDIT_ICONS } from './Nav.constants';

export function CreditsPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" icon={<Heart className="size-3.5" />}>
          <span className="hidden sm:inline">Credits</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl bg-neutral-900/95 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
        >
          <ul className="divide-y divide-white/[0.06]">
            {CREDITS.map(c => (
              <li key={c.who} className="px-3 py-2.5">
                <p className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  <span className="text-fg-muted">{CREDIT_ICONS[c.who]}</span>
                  {'href' in c ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 hover:text-accent"
                    >
                      {c.who}
                      <ArrowUpRight className="size-3" />
                    </a>
                  ) : (
                    c.who
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{c.what}</p>
              </li>
            ))}
          </ul>
          <Popover.Arrow className="fill-neutral-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
