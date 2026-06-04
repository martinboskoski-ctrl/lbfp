# PackFlow Docx Template Automator — Agent Memory

## Project Location
`/Users/martinboshkoski/packflow/`

## Documents Automated

### NDA - LBFP (Confidentiality Agreement)
- Source: `.claude/documentsToAutomate/NDA - LBFP (automated).docx`
- Sector: Тековни Теркови (terkovi tab, sales + top_management depts)
- Template: `server/src/templates/terkovi/nda-template.docx`
- Fields: `{date}` (x2, ENG+MKD), `{secondPartyName}` (x2), `{secondPartyEmail}` (x1)
- Static: First party always LUTHMAN BACKLUND FOODS PRODUCTION DOO Bitola, Manager Ivan Atanasovski
- Bilingual: Full ENG + MKD text in single document; date formatted per language selection

### Contract Annex — Анекс на договорот за вработување
- Sector: Тековни Теркови (terkovi tab, hr + top_management depts)
- Template: `server/src/templates/terkovi/contract-annex.docx` (generated programmatically via script)
- Script: `server/scripts/create-contract-annex-template.mjs`
- Fields: `{date}` (x2), `{employeeName}`, `{employeePin}`, `{contractNumber}`, `{contractDate}`, `{newEndDate}`
- Language: MKD only; dates formatted with `toLocaleDateString('mk-MK', { day:'2-digit', month:'long', year:'numeric' })`
- Access guard: server-side check `req.user.department !== 'hr' && !== 'top_management'` → 403
- Schema: `client/src/schemas/terkovi/contractAnnexSchema.js`; uses `.refine()` for newEndDate > contractDate
- Form: `client/src/components/terkovi/ContractAnnexForm.jsx`; EMBG input: `inputMode="numeric" maxLength={13}`
- Gallery entry: `TerkoviGallery.jsx` TEMPLATES array, id `contract-annex`, depts `['top_management','hr']`
- i18n keys added to: `terkovi.json` (mk+en) under `contractAnnex.*`, `template.contractAnnex.*`
- Validation keys added to: `common.json` (mk+en) under `validation.invalidEmbg`, `validation.endDateAfterContractDate`

## Key Patterns Established

### docxtemplater API (v3.68.3)
- `doc.render(data)` — current API. Pass data directly to `render()`.
- `doc.setData(data)` — DEPRECATED. Still works but logs warning. Do NOT use.
- Constructor: `new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })`
- Both `pizzip` and `docxtemplater` use CommonJS exports. Use `createRequire(import.meta.url)` to require them in ESM server files.
- See `patterns.md` for full import pattern.

### Route Structure
- Server route file: `server/src/routes/terkovi.routes.js`
- Server controller: `server/src/controllers/terkovi.controller.js`
- Mount in `server/src/app.js`: `app.use('/api/terkovi', terkoviRoutes)`
- Auth middleware: `authenticate` from `server/src/middleware/auth.js`

### Client API
- `VITE_API_URL=http://localhost:5001/api` set in `client/.env.local`
- Axios instance baseURL already resolves to port 5001 via env var
- NDA form POST: `api.post('/terkovi/nda/generate', data, { responseType: 'blob' })`

### Dashboard Integration
- Terkovi tab placeholder was: `Теркови — наскоро` (lines 193-197 Dashboard.jsx)
- Now replaced with `<NDAForm />` component for all departments
- Form available at: `?dept=top_management&tab=terkovi` and `?dept=sales&tab=terkovi`

### Template Tagging Approach
- If DOCX already has `{tag}` placeholders — keep them, verify with XML inspection
- Replace underscore blank lines by editing the raw XML in the `word/document.xml` inside the zip
- Use PizZip to read/write; replace specific XML `<w:t>` text content
- Write modified zip back to `server/src/templates/[sector]/[document].docx`
- Always smoke-test with render + verify no leftover `{tag}` strings in output XML

### Programmatic Template Generation (new pattern — Contract Annex)
- For new documents with no pre-existing .docx, generate the template programmatically
- Use a `server/scripts/create-[document]-template.mjs` script; run once via `node`
- Build minimal OOXML: `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/_rels/document.xml.rels`, `word/settings.xml`, `word/styles.xml`
- Split text at `{tag}` boundaries so each tag is its own `<w:r>` element — docxtemplater requires this
- A helper `p(text, opts)` that auto-splits on `{tag}` is the key pattern
- Use a companion `smoke-test-[document].mjs` script to verify zero leftover tags in rendered XML
- Smoke test checks output XML with regex `/\{[^}]+\}/g` after `doc.render()`

## File Naming Conventions
- Template: `server/src/templates/[sector]/[document-name].docx`
- Route: `server/src/routes/[sector].routes.js`
- Controller: `server/src/controllers/[sector].controller.js`
- Schema: `client/src/schemas/[sector]/[documentName]Schema.js`
- Form component: `client/src/components/[sector]/[DocumentName]Form.jsx`

## See Also
- `patterns.md` — detailed ESM+CJS import pattern for docxtemplater
