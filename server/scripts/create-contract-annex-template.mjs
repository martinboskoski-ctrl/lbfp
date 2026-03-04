/**
 * Creates the contract-annex.docx template for docxtemplater.
 * Run once: node server/scripts/create-contract-annex-template.mjs
 *
 * The script builds a minimal but correctly formatted OOXML .docx that
 * mirrors the original "АНЕКС НА ДОГОВОРОТ ЗА ВРАБОТУВАЊЕ" document and
 * replaces every variable with a docxtemplater {tag}.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require  = createRequire(import.meta.url);
const PizZip   = require('pizzip');

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Output path
const OUTPUT_PATH = path.join(
  __dirname,
  '../src/templates/terkovi/contract-annex.docx'
);

// ---------------------------------------------------------------------------
// Minimal valid OOXML skeleton
// We embed the document body directly in document.xml.
// docxtemplater reads {tag} markers from <w:t> elements.
// ---------------------------------------------------------------------------

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/styles.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

const WORD_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings"
    Target="settings.xml"/>
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    Target="styles.xml"/>
</Relationships>`;

const SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
</w:settings>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
          w:latentStyleCount="371">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="mk-MK" w:eastAsia="mk-MK" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:jc w:val="both"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:line="276" w:lineRule="auto" w:before="0" w:after="0"/>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="120" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="80" w:after="80"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;

// Helper: wrap plain text in a paragraph with optional bold / centered props
const p = (text, { bold = false, center = false, spacing = '' } = {}) => {
  const jc    = center   ? `<w:jc w:val="center"/>` : `<w:jc w:val="both"/>`;
  const bOpen = bold     ? '<w:b/>'                 : '';
  const sp    = spacing  ? `<w:spacing ${spacing}/>` : '<w:spacing w:line="276" w:lineRule="auto" w:before="0" w:after="0"/>';

  // Split on `{tag}` boundaries so each tag is its own <w:r> (docxtemplater requirement)
  const parts = text.split(/(\{[^}]+\})/g);
  const runs  = parts.map((part) => {
    if (!part) return '';
    return `<w:r><w:rPr>${bOpen}</w:rPr><w:t xml:space="preserve">${xmlEsc(part)}</w:t></w:r>`;
  }).join('');

  return `<w:p><w:pPr>${sp}${jc}</w:pPr>${runs}</w:p>`;
};

const xmlEsc = (s) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;');

// Empty paragraph for spacing
const empty = (n = 1) =>
  Array(n).fill('<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:before="0" w:after="0"/><w:jc w:val="both"/></w:pPr></w:p>').join('');

// Signature table row
const sigRow = (left, right) => `
<w:tr>
  <w:tc>
    <w:tcPr><w:tcW w:w="4608" w:type="dxa"/><w:tcBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders></w:tcPr>
    <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(left)}</w:t></w:r></w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="4608" w:type="dxa"/><w:tcBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders></w:tcPr>
    <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(right)}</w:t></w:r></w:p>
  </w:tc>
</w:tr>`;

// ---------------------------------------------------------------------------
// Build document.xml body
// ---------------------------------------------------------------------------
const body = `
${p(
  'Врз основа на член 13 став 1, 14 став 1, 15 став 1 и член 28 од Законот за работните односи (Службен весник на РМ број 62/05, 106/08, 161/08, 114/09, 130/09, 50/10, 52/10, 124/10, 47/11, 11/12 39/12, 13/13, 25/13, 170/13 и 187/13) во просториите на Друштво за производство, трговија и услуги ЛУТХМАН БАЦКЛУНД ФООДС ПРОДУЦТИОН ДОО Битола, со седиште на ул. Воден бр.37- Битола, со ЕДБ4032017535670 и ЕMБС 7231849, се склучува следниот:'
)}
${empty()}
${p('АНЕКС НА ДОГОВОРОТ ЗА ВРАБОТУВАЊЕ', { bold: true, center: true, spacing: 'w:before="120" w:after="0"' })}
${p('Склучен на ден {date} година помеѓу:', { center: true })}
${empty()}
${p('1.\tДруштво за производство, трговија и услуги ЛУТХМАН БАЦКЛУНД ФООДС ПРОДУЦТИОН ДОО Битола, со седиште на ул. Воден бр. 37 - Битола , со ЕДБ4032017535670 и ЕMБС 7231849 (во продолжение на текстот само „Работодавач") и')}
${p('2.\tРаботникот {employeeName}, со ЕМБГ {employeePin} (во продолжение на текстот: „Работник").')}
${empty()}
${p('Член 1', { bold: true, center: true })}
${empty()}
${p('Со овој анекс на договорот за вработување број {contractNumber} од {contractDate} год. се менува чл. 2 и гласи:')}
${p('Договорот за вработување е склучен за определено времетраење и истиот завршува заклучно до {newEndDate} година.')}
${p('Овој договор стапува на сила на {date} година.')}
${empty()}
${p('Член 2', { bold: true, center: true })}
${empty()}
${p('Сите останати одредби од Договорот за вработување остануваат непроменети.')}
${empty()}
${p('Член 3', { bold: true, center: true })}
${empty()}
${p('Овој Анекс е составен во 2 (два) примероци, по 1 (еден) примерок за секоја договорна страна.')}
${empty(3)}
<w:tbl>
  <w:tblPr>
    <w:tblStyle w:val="TableNormal"/>
    <w:tblW w:w="9216" w:type="dxa"/>
    <w:tblBorders>
      <w:top    w:val="none"/>
      <w:left   w:val="none"/>
      <w:bottom w:val="none"/>
      <w:right  w:val="none"/>
      <w:insideH w:val="none"/>
      <w:insideV w:val="none"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="4608"/>
    <w:gridCol w:w="4608"/>
  </w:tblGrid>
  ${sigRow('Работодавач:', 'Работник:')}
  ${sigRow('ЛУТХМАН БАЦКЛУНД ФООДС', '')}
  ${sigRow('  ПРОДУЦТИОН ДОО Битола', '')}
  ${sigRow('', '')}
  ${sigRow('_________________________', '_________________________')}
</w:tbl>
<w:sectPr>
  <w:pgSz w:w="11906" w:h="16838"/>
  <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>
</w:sectPr>`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>${body}</w:body>
</w:document>`;

// ---------------------------------------------------------------------------
// Assemble the .docx zip
// ---------------------------------------------------------------------------
const zip = new PizZip();

zip.file('[Content_Types].xml',              CONTENT_TYPES);
zip.file('_rels/.rels',                      RELS);
zip.file('word/document.xml',                DOCUMENT_XML);
zip.file('word/_rels/document.xml.rels',     WORD_RELS);
zip.file('word/settings.xml',               SETTINGS);
zip.file('word/styles.xml',                 STYLES);

const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, buffer);

console.log('Template created at:', OUTPUT_PATH);
