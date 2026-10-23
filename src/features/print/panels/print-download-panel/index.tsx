import { useMemo } from 'react';
import { estimate } from '@/core/print/estimate';
import type { PrintDownloadPanelProps } from './print-download-panel.types';
import { PrintDownloadPanelView } from './PrintDownloadPanel.view';

export function PrintDownloadPanel(props: PrintDownloadPanelProps) {
  const { plan } = props;
  const est = useMemo(() => (plan ? estimate(plan) : null), [plan]);
  return <PrintDownloadPanelView {...props} estimate={est} />;
}
