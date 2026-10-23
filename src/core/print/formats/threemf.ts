/** 3MF writer (core spec, millimetres): the preferred format for a manifold solid. */
import { BRAND } from '@/config/brand';
import type { IndexedMesh } from './mesh.types';
import { zip } from './zip';

const xmlEscape = (s: string) =>
  s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;

export function to3MF({ positions: P, indices: I }: IndexedMesh, title = 'hello'): Blob {
  const name = xmlEscape(title);
  const parts: string[] = [];
  for (let i = 0; i < P.length; i += 3) {
    parts.push(`<vertex x="${+P[i].toFixed(4)}" y="${+P[i + 1].toFixed(4)}" z="${+P[i + 2].toFixed(4)}"/>`);
  }
  const vertices = parts.join('');
  parts.length = 0;
  for (let t = 0; t < I.length; t += 3)
    parts.push(`<triangle v1="${I[t]}" v2="${I[t + 1]}" v3="${I[t + 2]}"/>`);
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${name}</metadata>
<metadata name="Application">${BRAND.name}</metadata>
<resources><object id="1" type="model" name="${name}"><mesh><vertices>${vertices}</vertices><triangles>${parts.join('')}</triangles></mesh></object></resources>
<build><item objectid="1"/></build>
</model>`;
  const bytes = zip([
    ['[Content_Types].xml', CONTENT_TYPES],
    ['_rels/.rels', RELS],
    ['3D/3dmodel.model', model],
  ]);
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'model/3mf' });
}
