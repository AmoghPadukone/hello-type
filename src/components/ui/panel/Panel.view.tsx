import { cn } from '@/utils/cn';
import type { PanelProps } from './panel.types';

export function Panel({ title, description, action, className, children }: PanelProps) {
  return (
    <section className={cn('rounded-2xl bg-surface p-5 ring-1 ring-white/[0.07]', className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{description}</p>}
        </div>
        {action}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
