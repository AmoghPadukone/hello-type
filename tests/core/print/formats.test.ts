import { describe, expect, it } from 'vitest';
import { to3MF } from '@/core/print/formats/threemf';
import { toSTL } from '@/core/print/formats/stl';
import { crc32, zip } from '@/core/print/formats/zip';

const tetra = {
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]),
  indices: new Uint32Array([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]),
};

describe('crc32', () => {
  it('matches the reference value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('zip', () => {
  it('writes local headers, a central directory and an end record', () => {
    const bytes = zip([
      ['a.txt', 'hello'],
      ['dir/b.txt', 'world!'],
    ]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const centralOffset = view.getUint32(end + 16, true);
    expect(view.getUint32(centralOffset, true)).toBe(0x02014b50);
  });
});

describe('STL', () => {
  it('writes 50 bytes per triangle after an 84-byte header', async () => {
    const buf = await toSTL(tetra).arrayBuffer();
    expect(buf.byteLength).toBe(84 + 4 * 50);
    expect(new DataView(buf).getUint32(80, true)).toBe(4);
  });
});

describe('3MF', () => {
  it('packages a millimetre model with every vertex and triangle', async () => {
    const bytes = new Uint8Array(await to3MF(tetra, 'a <b>').arrayBuffer());
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('unit="millimeter"');
    expect(text.match(/<vertex /g)).toHaveLength(4);
    expect(text.match(/<triangle /g)).toHaveLength(4);
    expect(text).toContain('a &lt;b&gt;');
  });
});
