export type ExportFormat = '3mf' | 'stl';

export type ExportStatus =
  | { kind: 'idle' }
  | { kind: 'busy'; format: ExportFormat }
  | { kind: 'done'; message: string; note?: string }
  | { kind: 'error'; message: string };
