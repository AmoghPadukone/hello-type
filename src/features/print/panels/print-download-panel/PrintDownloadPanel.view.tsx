import { CircleCheck, Download, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { formatMM } from '@/utils/format';
import type { PrintDownloadPanelViewProps } from './print-download-panel.types';

/** Size estimate, warnings, the 3MF/STL buttons and the export status line. */
export function PrintDownloadPanelView({
  plan,
  status,
  onExport,
  estimate: est,
}: PrintDownloadPanelViewProps) {
  const busy = status.kind === 'busy';
  const stand = plan?.orientation === 'stand';
  return (
    <Panel title="Download model">
      {est && (
        <dl className="grid grid-cols-4 gap-2">
          {(
            [
              ['Width', est.widthMM],
              [stand ? 'Height' : 'Length', est.heightMM],
              ['Depth', est.depthMM],
              ['Tube Ø', est.tubeMM],
            ] as const
          ).map(([label, v]) => (
            <div
              key={label}
              className="rounded-xl bg-black/40 px-2.5 py-2 ring-1 ring-inset ring-white/[0.06]"
            >
              <dt className="text-[10px] font-medium tracking-wide text-fg-subtle uppercase">{label}</dt>
              <dd className="font-mono text-sm text-fg tabular-nums">
                {formatMM(v)}
                <span className="ml-0.5 text-[10px] text-fg-subtle">mm</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {est?.warnings.map(w => (
        <p
          key={w}
          className="flex gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning ring-1 ring-inset ring-warning/20"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {w}
        </p>
      ))}
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          disabled={!plan || busy}
          loading={busy && status.format === '3mf'}
          onClick={() => onExport('3mf')}
          icon={<Download className="size-4" />}
        >
          Download 3MF
        </Button>
        <Button
          disabled={!plan || busy}
          loading={busy && status.format === 'stl'}
          onClick={() => onExport('stl')}
        >
          STL
        </Button>
      </div>
      <div aria-live="polite" className="text-xs leading-relaxed">
        {busy && <p className="text-fg-subtle">Building a watertight solid…</p>}
        {status.kind === 'done' && (
          <div className="space-y-1">
            <p className="flex gap-2 text-success">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0" />
              {status.message}
            </p>
            {status.note && <p className="text-fg-muted">{status.note}</p>}
          </div>
        )}
        {status.kind === 'error' && <p className="text-danger">{status.message}</p>}
        {status.kind === 'idle' && (
          <p className="text-fg-subtle">
            3MF keeps units and is best for modern slicers. Standing pieces print upright — use tree supports
            under the loops.
          </p>
        )}
      </div>
    </Panel>
  );
}
