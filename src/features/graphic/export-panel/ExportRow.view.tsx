import { cn } from '@/utils/cn';
import type { ExportRowProps } from './export-panel.types';

export function ExportRow({ icon, title, detail, onClick, disabled, primary }: ExportRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset transition-colors',
        'focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40',
        primary
          ? 'bg-accent/15 ring-accent/30 hover:bg-accent/25'
          : 'bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.07]',
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4',
          primary ? 'bg-accent text-white' : 'bg-white/[0.07] text-fg-muted',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-fg">{title}</span>
        <span className="block truncate text-xs text-fg-subtle">{detail}</span>
      </span>
    </button>
  );
}
