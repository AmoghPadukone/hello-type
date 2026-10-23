import { FileCode2, Film, Image } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { PNG_EXPORT } from '@/config/constants';
import type { ExportPanelProps } from './export-panel.types';
import { ExportRow } from './ExportRow.view';

export function ExportPanel({ disabled, onSvg, onAnimated, onPng }: ExportPanelProps) {
  return (
    <Panel title="Download 2D" description="Vector output in the same format as Apple’s SF-Hello SVGs.">
      <div className="grid gap-2">
        <ExportRow
          icon={<FileCode2 />}
          title="SVG"
          detail="Static vector, editable anywhere"
          onClick={onSvg}
          disabled={disabled}
          primary
        />
        <ExportRow
          icon={<Film />}
          title="Animated SVG"
          detail="Draws itself when opened in a browser"
          onClick={onAnimated}
          disabled={disabled}
        />
        <ExportRow
          icon={<Image />}
          title="PNG"
          detail={`Transparent, up to ${PNG_EXPORT.maxWidth} px wide`}
          onClick={onPng}
          disabled={disabled}
        />
      </div>
    </Panel>
  );
}
