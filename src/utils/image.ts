import { PNG_EXPORT } from '@/config/constants';

/** Rasterises an SVG document to a PNG, `maxWidth` pixels wide at most (and at most `maxScale`× its viewBox). */
export async function svgToPng(
  svg: string,
  maxWidth: number = PNG_EXPORT.maxWidth,
  maxScale: number = PNG_EXPORT.maxScale,
): Promise<Blob> {
  const [, , w, h] = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1 1').split(' ').map(Number);
  const scale = Math.min(maxScale, maxWidth / w);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
