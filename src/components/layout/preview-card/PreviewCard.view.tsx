import { cn } from '@/utils/cn';
import type { PreviewCardProps } from './preview-card.types';

/** The large preview surface shared by both workspaces: a label top-left, actions top-right. */
export function PreviewCard({ label, actions, className, children }: PreviewCardProps) {
  return (
    <div
      className={cn(
        'relative grid h-[300px] place-items-center overflow-hidden rounded-3xl bg-surface ring-1 ring-white/[0.07] sm:h-[420px] xl:h-[540px]',
        className,
      )}
    >
      <span className="pointer-events-none absolute top-4 left-5 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg-muted backdrop-blur">
        {label}
      </span>
      {actions && <div className="absolute top-3 right-3 z-10 flex gap-1">{actions}</div>}
      {children}
    </div>
  );
}
