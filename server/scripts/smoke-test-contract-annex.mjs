/**
 * Smoke test: render the contract-annex template with sample data and
 * verify the output buffer is a valid zip with no leftover {tag} strings.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require      = createRequire(import.meta.url);
const PizZip       = require('pizzip');
const Docxtemplater = require('docxtemplater');

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, '../src/templates/terkovi/contract-annex.docx');
const OUT_PATH      = path.join(__dirname, '../src/templates/terkovi/contract-annex-SMOKE.docx');

const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
const zip     = new PizZip(content);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks:    true,
  nullGetter:    () => '',
});

const sampleData = {
  date:           '04 март 2026',
  employeeName:   'Марија Петрова',
  employeePin:    '0101990450001',
  contractNumber: '123/2021',
  contractDate:   '01 јануари 2021',
  newEndDate:     '31 декември 2026',
};

doc.render(sampleData);

const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

// Check for leftover tags in the rendered XML
const outZip = new PizZip(buffer);
const docXml = outZip.file('word/document.xml').asText();
const leftover = [...docXml.matchAll(/\{[^}]+\}/g)].map((m) => m[0]);
if (leftover.length > 0) {
  console.error('LEFTOVER TAGS FOUND:', leftover);
  process.exit(1);
}

fs.writeFileSync(OUT_PATH, buffer);
console.log('Smoke test PASSED. Output written to:', OUT_PATH);

// Print a snippet of the rendered XML for visual confirmation
const snippet = docXml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 500);
console.log('\nText snippet from rendered doc:\n', snippet);
