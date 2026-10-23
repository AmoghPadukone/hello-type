import { toSVG } from '@/core/svg/svg';
import type { Stroke } from '@/core/types';
import { downloadBlob, svgBlob } from '@/utils/file';
import { svgToPng } from '@/utils/image';
import { slug } from '@/utils/text';
import type { GraphicExports } from '../graphic.types';

interface Input {
  text: string;
  strokes: readonly Stroke[];
  lengths: readonly number[];
  /** The static SVG, already built for the preview. */
  svg: string;
  color: string;
  weight: number;
  speed: number;
}

/** Download handlers for SVG, animated SVG and PNG, named after the text. */
export function useGraphicExports({
  text,
  strokes,
  lengths,
  svg,
  color,
  weight,
  speed,
}: Input): GraphicExports {
  const name = slug(text);
  return {
    onSvg: () => {
      downloadBlob(svgBlob(svg), `${name}.svg`);
    },
    onAnimated: () => {
      downloadBlob(
        svgBlob(toSVG(strokes, { color, width: weight, animate: true, lengths, speed })),
        `${name}.animated.svg`,
      );
    },
    onPng: () =>
      svgToPng(svg).then(png => {
        downloadBlob(png, `${name}.png`);
      }, console.error),
  };
}
