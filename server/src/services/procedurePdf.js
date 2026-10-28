import { createRequire } from 'module';
import path from 'path';
import PDFDocument from 'pdfkit';

// DejaVu Sans covers Cyrillic; the PDF standard fonts do not.
const require = createRequire(import.meta.url);
const FONT_DIR = path.join(path.dirname(require.resolve('dejavu-fonts-ttf/package.json')), 'ttf');
const FONT = path.join(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf');

const COMPANY = 'ЛБФП ДОО Битола';

const DEPT_LABELS = {
  top_management: 'Топ менаџмент',
  sales: 'Продажба',
  finance: 'Финансии',
  administration: 'Администрација',
  hr: 'Човечки ресурси',
  quality_assurance: 'Обезбедување квалитет',
  facility: 'Објект',
  machines: 'Машини',
  r_and_d: 'Истражување и развој',
  production: 'Производство',
  carina: 'Царина',
  nabavki: 'Набавки (суровини и амбалажа)',
  safety: 'Безбедност и сертификации',
};

const COLOR = { text: '#1e293b', muted: '#64748b', rule: '#cbd5e1' };
const MARGIN = 56;

const fmtDate = (d) => {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
};

// Article headings ("Член 5") and ALL-CAPS section titles render bold.
const isHeading = (line) =>
  /^Член\s+\d+/.test(line) ||
  (line.length < 120 && /\p{L}/u.test(line) && line === line.toUpperCase());

// "• item", "1. item", "2) item", "а) item" — rendered with a hanging indent.
const LIST_ITEM = /^(•|[-–]|\d+[.)]|\p{L}\))\s+(.+)$/u;

/** Renders a procedure to a PDF and pipes it into `stream` (e.g. an Express response). */
export const writeProcedurePdf = (procedure, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN + 14, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: { Title: procedure.title, Author: COMPANY },
  });
  doc.registerFont('regular', FONT);
  doc.registerFont('bold', FONT_BOLD);
  doc.pipe(stream);

  const width = doc.page.width - MARGIN * 2;

  // Header
  doc.font('regular').fontSize(8.5).fillColor(COLOR.muted)
    .text(`${COMPANY}  ·  Книга на процедури`, { width });
  doc.moveDown(1.2);
  doc.font('bold').fontSize(17).fillColor(COLOR.text)
    .text(procedure.title, { width, lineGap: 2 });
  doc.moveDown(0.5);

  const scope = procedure.departments?.length
    ? `Сектори: ${procedure.departments.map((d) => DEPT_LABELS[d] || d).join(', ')}`
    : 'Општа процедура · важи за сите вработени';
  doc.font('regular').fontSize(9).fillColor(COLOR.muted)
    .text(`${scope}   ·   Датум: ${fmtDate(procedure.createdAt)}`, { width });

  doc.moveDown(0.8);
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + width, doc.y)
    .lineWidth(0.6).strokeColor(COLOR.rule).stroke();
  doc.moveDown(1);

  // Body — blank lines separate paragraphs; single newlines are kept as line breaks.
  const blocks = procedure.content.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    for (const line of lines) {
      if (isHeading(line)) {
        // Keep a heading with at least a few lines of its text.
        if (doc.y + 60 > doc.page.height - doc.page.margins.bottom) doc.addPage();
        doc.moveDown(0.3);
        doc.font('bold').fontSize(10.5).fillColor(COLOR.text).text(line, { width, lineGap: 2 });
        doc.moveDown(0.15);
      } else {
        doc.font('regular').fontSize(10).fillColor(COLOR.text);
        const item = line.match(LIST_ITEM);
        if (item) {
          const [, marker, rest] = item;
          const indent = Math.max(14, doc.widthOfString(marker) + 5);
          if (doc.y + 14 > doc.page.height - doc.page.margins.bottom) doc.addPage();
          const y = doc.y;
          doc.text(marker, MARGIN, y, { lineBreak: false });
          doc.text(rest, MARGIN + indent, y, { width: width - indent, lineGap: 2.5 });
          doc.x = MARGIN;
        } else {
          doc.text(line, MARGIN, doc.y, { width, lineGap: 2.5 });
        }
      }
    }
    doc.moveDown(0.6);
  }

  // Footer on every page
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // allow writing inside the bottom margin without paging
    const y = doc.page.height - MARGIN + 6;
    doc.font('regular').fontSize(8).fillColor(COLOR.muted);
    doc.text(procedure.title, MARGIN, y, { width: width - 80, lineBreak: false, ellipsis: true });
    doc.text(`Страна ${i - start + 1} од ${count}`, MARGIN, y, { width, align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottom;
  }

  doc.end();
};
