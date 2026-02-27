# Patterns — Docx Template Automator

## ESM + CJS Import Pattern for docxtemplater/pizzip

Both packages expose only CommonJS. In ESM server files, use:

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
```

## docxtemplater v3 Render API

```js
const zip = new PizZip(fs.readFileSync(templatePath, 'binary'));
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

// CURRENT API — pass data to render()
doc.render({
  fieldOne: 'value',
  fieldTwo: 'value',
});

const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
```

## Template Tag Replacement in Existing DOCX

When a DOCX has raw text that needs to become a template tag:

1. Read DOCX with PizZip: `const zip = new PizZip(readFileSync(path, 'binary'))`
2. Get XML: `let docXml = zip.files['word/document.xml'].asText()`
3. Replace the exact XML text segment (match the `<w:t>` element content)
4. Write back: `zip.file('word/document.xml', modifiedDocXml)`
5. Save: `const buf = zip.generate({ type: 'nodebuffer' }); writeFileSync(outPath, buf)`

Critical: DOCX splits text across multiple `<w:r>/<w:t>` runs. Search for the visible text
by stripping XML tags first to identify context, then match the raw XML exactly.

## Date Formatting

```js
const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
  language === 'MKD' ? 'mk-MK' : 'en-GB',
  { day: '2-digit', month: 'long', year: 'numeric' }
);
```

## Blob Download Pattern (Client)

```js
const response = await api.post('/path/generate', data, { responseType: 'blob' });
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'filename.docx');
document.body.appendChild(link);
link.click();
link.remove();
window.URL.revokeObjectURL(url);
```

## Response Headers for DOCX Download

```js
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.send(buffer);
```
