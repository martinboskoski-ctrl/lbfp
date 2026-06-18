import i18next from 'i18next';

// Translate within the agreements namespace, with a literal fallback.
const ta = (key, opts) => i18next.t(key, { ns: 'agreements', ...opts });
// Department labels live in the common namespace.
const tDept = (dept) => i18next.t(`dept.${dept}`, { ns: 'common', defaultValue: dept });

// ── Palette (ARGB, ExcelJS wants the leading alpha byte) ─────────────────────
const C = {
  headerBg:  'FF1E293B', // slate-800
  headerFg:  'FFFFFFFF',
  titleFg:   'FF0F172A', // slate-900
  zebra:     'FFF8FAFC', // slate-50
  border:    'FFE2E8F0', // slate-200
};
const STATUS_COLOR = {
  active:        { bg: 'FFD1FAE5', fg: 'FF065F46' },
  expiring_soon: { bg: 'FFFEF3C7', fg: 'FF92400E' },
  expired:       { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  negotiating:   { bg: 'FFE0F2FE', fg: 'FF075985' },
  for_renewal:   { bg: 'FFEDE9FE', fg: 'FF5B21B6' },
  renewing:      { bg: 'FFEDE9FE', fg: 'FF5B21B6' },
  terminated:    { bg: 'FFF1F5F9', fg: 'FF475569' },
  renewed:       { bg: 'FFF1F5F9', fg: 'FF475569' },
  archived:      { bg: 'FFF1F5F9', fg: 'FF64748B' },
  draft:         { bg: 'FFF1F5F9', fg: 'FF64748B' },
};
const RISK_COLOR = {
  low:      { bg: 'FFDCFCE7', fg: 'FF166534' },
  medium:   { bg: 'FFFEF9C3', fg: 'FF854D0E' },
  high:     { bg: 'FFFFEDD5', fg: 'FF9A3412' },
  critical: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
};
const thin = { style: 'thin', color: { argb: C.border } };
const ALL_BORDERS = { top: thin, left: thin, bottom: thin, right: thin };

// ── Column model (sector is the sheet, so it is not a column) ────────────────
const COLUMNS = [
  { key: 'seq',             width: 7,  kind: 'num' },
  { key: 'type',            width: 13 },
  { key: 'class',           width: 24 },
  { key: 'name',            width: 26 },
  { key: 'counterparty',    width: 26 },
  { key: 'contact',         width: 18 },
  { key: 'email',           width: 24 },
  { key: 'phone',           width: 16 },
  { key: 'category',        width: 16 },
  { key: 'signed',          width: 13, kind: 'date' },
  { key: 'start',           width: 13, kind: 'date' },
  { key: 'end',             width: 13, kind: 'date' },
  { key: 'daysLeft',        width: 11, kind: 'num' },
  { key: 'status',          width: 16 },
  { key: 'risk',            width: 10 },
  { key: 'value',           width: 14, kind: 'money' },
  { key: 'currency',        width: 9 },
  { key: 'payment',         width: 16 },
  { key: 'owner',           width: 18 },
  { key: 'archiveNo',       width: 13 },
  { key: 'confidentiality', width: 15 },
  { key: 'driveLink',       width: 14 },
];
const NUM_FMT = { date: 'dd.mm.yyyy', num: '0', money: '#,##0.00' };

const header = (key) => ta(`export.col.${key}`, { defaultValue: key });

const statusLabel = (a) => {
  const s = a.effectiveStatus;
  if (s === 'expiring_soon') return ta('list.expiringSoonOption', { defaultValue: 'Expiring soon' });
  return ta(`registerStatus.${s}`, { defaultValue: s });
};

// One value map per agreement, keyed by column key.
const rowFor = (a) => ({
  seq:             a.sequenceNumber ?? null,
  type:            a.documentType ? ta(`docType.${a.documentType}`, { defaultValue: a.documentType }) : '',
  class:           a.contractClass || '',
  name:            a.title || '',
  counterparty:    a.otherParty || '',
  contact:         a.counterpartyContact?.name || '',
  email:           a.counterpartyContact?.email || '',
  phone:           a.counterpartyContact?.phone || '',
  category:        a.category ? ta(`category.${a.category}`, { defaultValue: a.category }) : '',
  signed:          a.signedDate ? new Date(a.signedDate) : null,
  start:           a.startDate ? new Date(a.startDate) : null,
  end:             a.endDate ? new Date(a.endDate) : '∞',
  daysLeft:        a.daysUntilExpiry ?? null,
  status:          statusLabel(a),
  risk:            a.riskLevel || '',
  value:           a.value ?? null,
  currency:        a.currency || '',
  payment:         a.paymentTerms || '',
  owner:           a.owner?.name || '',
  archiveNo:       a.archiveNumber || '',
  confidentiality: a.confidentiality || '',
  driveLink:       a.driveLink
    ? { text: ta('list.openInDrive', { defaultValue: 'Open' }), hyperlink: a.driveLink }
    : '',
});

const safeSheetName = (name) =>
  String(name).replace(/[\\/?*:[\]]/g, ' ').trim().slice(0, 31) || 'Sheet';

// Build a styled worksheet for one sector's agreements.
const buildSheet = (wb, deptKey, rows, dateStr) => {
  const ws = wb.addWorksheet(safeSheetName(tDept(deptKey)), {
    views: [{ state: 'frozen', ySplit: 2 }],
  });
  const N = COLUMNS.length;
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));
  COLUMNS.forEach((c) => { if (c.kind) ws.getColumn(c.key).numFmt = NUM_FMT[c.kind]; });

  // Row 1 — title band.
  ws.mergeCells(1, 1, 1, N);
  const title = ws.getCell(1, 1);
  title.value = ta('export.titleLine', {
    sector: tDept(deptKey), count: rows.length, date: dateStr,
    defaultValue: `${tDept(deptKey)} — ${rows.length} · ${dateStr}`,
  });
  title.font = { bold: true, size: 13, color: { argb: C.titleFg } };
  title.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 26;

  // Row 2 — column headers.
  const hr = ws.getRow(2);
  COLUMNS.forEach((c, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = header(c.key);
    cell.font = { bold: true, color: { argb: C.headerFg } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = ALL_BORDERS;
  });
  hr.height = 20;
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: N } };

  // Data rows (start at row 3).
  rows.forEach((a, idx) => {
    const r = ws.addRow(rowFor(a));
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = ALL_BORDERS;
      cell.alignment = { vertical: 'middle' };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.zebra } };
      }
    });
    const sc = STATUS_COLOR[a.effectiveStatus];
    if (sc) {
      const cell = r.getCell('status');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } };
      cell.font = { bold: true, color: { argb: sc.fg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    const rc = RISK_COLOR[a.riskLevel];
    if (rc) {
      const cell = r.getCell('risk');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rc.bg } };
      cell.font = { color: { argb: rc.fg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    if (a.driveLink) {
      r.getCell('driveLink').font = { color: { argb: 'FF2563EB' }, underline: true };
    }
  });
};

/**
 * Export agreements (already permission-scoped + filtered on screen) to a styled .xlsx,
 * one worksheet per sector.
 * @param {Array} agreements
 * @param {string} sectorKey  active sector value, or '' for all sectors
 */
export const exportAgreementsToExcel = async (agreements, sectorKey = '') => {
  // Load ExcelJS on demand so it stays out of the main bundle.
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PackFlow';
  wb.created = new Date();

  const dateStr = new Date().toLocaleDateString(i18next.language === 'en' ? 'en-GB' : 'mk-MK');

  // Group by sector, preserving first-seen order.
  const groups = new Map();
  for (const a of agreements) {
    if (!groups.has(a.department)) groups.set(a.department, []);
    groups.get(a.department).push(a);
  }
  for (const [deptKey, rows] of groups) buildSheet(wb, deptKey, rows, dateStr);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const scope = sectorKey ? tDept(sectorKey) : ta('list.allSectors', { defaultValue: 'all' });
  const stamp = new Date().toISOString().slice(0, 10);
  const safeScope = String(scope).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  const fileName = `${ta('export.fileBase', { defaultValue: 'contracts' })}_${safeScope}_${stamp}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
