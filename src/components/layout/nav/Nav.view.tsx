import { BRAND } from '@/config/brand';
import { CreditsPopover } from './CreditsPopover.view';
import type { NavViewProps } from './nav.types';

export function NavView({ brandMarkSvg }: NavViewProps) {
  return (
    <nav className="sticky top-0 z-30 -mx-4 flex h-14 items-center justify-between gap-3 border-b border-white/[0.04] bg-bg/75 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <a href="./" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-[10px] bg-fg p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_16px_rgba(10,132,255,0.25)] [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: brandMarkSvg }}
        />
        <span className="text-[15px] font-semibold tracking-tight text-fg">{BRAND.name}</span>
      </a>
      <CreditsPopover />
    </nav>
  );
}
