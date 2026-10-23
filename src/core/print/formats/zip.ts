/** Minimal ZIP writer (stored, no compression): all a 3MF package needs. */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files: [name: string, content: string][]): Uint8Array {
  const enc = new TextEncoder();
  const entries = files.map(([name, text]) => {
    const nameBytes = enc.encode(name);
    const data = enc.encode(text);
    return { nameBytes, data, crc: crc32(data) };
  });
  const localSize = entries.reduce((n, e) => n + 30 + e.nameBytes.length + e.data.length, 0);
  const centralSize = entries.reduce((n, e) => n + 46 + e.nameBytes.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  let o = 0;
  const offsets: number[] = [];
  for (const e of entries) {
    offsets.push(o);
    view.setUint32(o, 0x04034b50, true);
    view.setUint16(o + 4, 20, true); // version needed
    view.setUint32(o + 14, e.crc, true);
    view.setUint32(o + 18, e.data.length, true);
    view.setUint32(o + 22, e.data.length, true);
    view.setUint16(o + 26, e.nameBytes.length, true);
    out.set(e.nameBytes, o + 30);
    out.set(e.data, o + 30 + e.nameBytes.length);
    o += 30 + e.nameBytes.length + e.data.length;
  }
  entries.forEach((e, i) => {
    view.setUint32(o, 0x02014b50, true);
    view.setUint16(o + 4, 20, true); // version made by
    view.setUint16(o + 6, 20, true); // version needed
    view.setUint32(o + 16, e.crc, true);
    view.setUint32(o + 20, e.data.length, true);
    view.setUint32(o + 24, e.data.length, true);
    view.setUint16(o + 28, e.nameBytes.length, true);
    view.setUint32(o + 42, offsets[i], true);
    out.set(e.nameBytes, o + 46);
    o += 46 + e.nameBytes.length;
  });
  view.setUint32(o, 0x06054b50, true);
  view.setUint16(o + 8, entries.length, true);
  view.setUint16(o + 10, entries.length, true);
  view.setUint32(o + 12, centralSize, true);
  view.setUint32(o + 16, localSize, true);
  return out;
}
