/** Saves a blob as a file via a temporary object URL. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const svgBlob = (svg: string) => new Blob([svg], { type: 'image/svg+xml' });
