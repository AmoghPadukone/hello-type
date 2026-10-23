import type { MobileCTAProps } from './mobile-cta.types';

/** Keeps the primary download one tap away on small screens, where the sidebar is far below. */
export function MobileCTA({ children }: MobileCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-bg/85 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      {children}
    </div>
  );
}
