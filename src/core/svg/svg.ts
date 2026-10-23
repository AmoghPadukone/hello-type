/**
 * Strokes → SVG, plus the stroke length and draw timing that the 2D preview, the animated SVG
 * and the 3D preview all share, so every animation moves at the same pace.
 */
import { bezierPoint } from '@/core/bezier';
import { bounds } from '@/core/glyphs/compose';
import type { Stroke } from '@/core/types';
import type { SvgOptions } from './svg.types';

/** Strokes shorter than this (i/j dots) can't be dash-animated; they just appear on cue. */
export const DOT_LENGTH = 1;

/** Drawing pace at speed 1, in seconds per 1000 glyph units of stroke length. */
const SECONDS_PER_1000 = 0.3;

/** How long a stroke of `length` glyph units takes to draw (shared by the 2D and 3D previews). */
export const strokeDuration = (length: number, speed = 1): number =>
  Math.max(0.12, ((length / 1000) * SECONDS_PER_1000) / speed);

/** Approximate 2D length of a stroke in glyph units (each cubic sampled as a polyline). */
export function strokeLength(stroke: Stroke, samplesPerSegment = 24): number {
  let total = 0;
  for (const seg of stroke) {
    let [px, py] = seg[0];
    for (let i = 1; i <= samplesPerSegment; i++) {
      const [x, y] = bezierPoint(seg, i / samplesPerSegment);
      total += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
  }
  return total;
}

const fmt = (n: number) => +n.toFixed(2);

function pathData(stroke: Stroke): string {
  return stroke
    .map((seg, i) => {
      const [p0, p1, p2, p3] = seg.map(([x, y]) => `${fmt(x)},${fmt(y)}`);
      return `${i ? '' : `M${p0} `}C${p1} ${p2} ${p3}`;
    })
    .join(' ');
}

const escapeAttr = (s: string) => s.replace(/[&"<>]/g, c => `&#${c.charCodeAt(0)};`);

/**
 * Builds an SVG document in the same shape as SF-Hello's convert.py output: a viewBox around
 * the strokes, a y-flipping group, round caps.
 */
export function toSVG(
  strokes: readonly Stroke[],
  { color = '#000', width = 60, animate = false, lengths = [], speed = 1 }: SvgOptions = {},
): string {
  if (!strokes.length) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>\n';
  const b = bounds(strokes);
  const pad = width / 2 + 4;
  const vb = [b.minX - pad, b.minY - pad, b.maxX - b.minX + 2 * pad, b.maxY - b.minY + 2 * pad].map(fmt);
  let delay = 0;
  const paths = strokes
    .map((s, i) => {
      let anim = '';
      if (animate) {
        const len = lengths[i] ?? 1000;
        const dur = strokeDuration(len, speed);
        const timing = `animation-duration:${fmt(dur)}s;animation-delay:${fmt(delay)}s`;
        anim = len < DOT_LENGTH ? ` class="dot" style="${timing}"` : ` pathLength="1" style="${timing}"`;
        delay += dur;
      }
      return `    <path d="${pathData(s)}"${anim}/>`;
    })
    .join('\n');
  // Strokes stay hidden until their turn so round caps don't show as dots ahead of the pen.
  const style = animate
    ? '  <style>path{visibility:hidden;stroke-dasharray:1;stroke-dashoffset:1;animation-name:draw;animation-timing-function:linear;animation-fill-mode:forwards}path.dot{stroke-dasharray:none;stroke-dashoffset:0;animation-name:show;animation-timing-function:step-start}@keyframes draw{from{visibility:visible}to{visibility:visible;stroke-dashoffset:0}}@keyframes show{to{visibility:visible}}</style>\n'
    : '';
  return `<?xml version="1.0" ?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}">
${style}  <g transform="scale(1, -1) translate(0, ${fmt(-b.maxY - b.minY)})" fill="none" stroke="${escapeAttr(color)}" stroke-width="${fmt(width)}" stroke-linecap="round" stroke-linejoin="round">
${paths}
  </g>
</svg>
`;
}
