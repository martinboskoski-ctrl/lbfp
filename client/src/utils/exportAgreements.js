import i18next from 'i18next';

// Translate within the agreements namespace, with a literal fallback.
const ta = (key, fallback) => i18next.t(key, { ns: 'agreements', defaultValue: fallback });
// Department labels live in the common namespace.
const tDept = (dept) => i18next.t(`dept.${dept}`, { ns: 'common', defaultValue: dept });

const asDate = (d) => (d ? new Date(d) : '');

const statusLabel = (a) => {
  const s = a.effectiveStatus;
  if (s === 'expiring_soon') return ta('list.expiringSoonOption', 'Expiring soon');
  return ta(`registerStatus.${s}`, s);
};

// Build one flat, localized row per agreement. Object key order defines column order.
const toRow = (a) => ({
  [ta('export.col.sector', 'Sector')]:          tDept(a.department),
  [ta('export.col.seq', 'No.')]:                a.sequenceNumber ?? '',
  [ta('export.col.type', 'Type')]:              a.documentType ? ta(`docType.${a.documentType}`, a.documentType) : '',
  [ta('export.col.class', 'Class / Subject')]:  a.contractClass || '',
  [ta('export.col.name', 'Name')]:              a.title || '',
  [ta('export.col.counterparty', 'Counterparty')]: a.otherParty || '',
  [ta('export.col.contact', 'Contact')]:        a.counterpartyContact?.name || '',
  [ta('export.col.email', 'Email')]:            a.counterpartyContact?.email || '',
  [ta('export.col.phone', 'Phone')]:            a.counterpartyContact?.phone || '',
  [ta('export.col.category', 'Category')]:      a.category ? ta(`category.${a.category}`, a.category) : '',
  [ta('export.col.signed', 'Signed')]:          asDate(a.signedDate),
  [ta('export.col.start', 'Start')]:            asDate(a.startDate),
  [ta('export.col.end', 'End')]:                a.endDate ? asDate(a.endDate) : '∞',
  [ta('export.col.daysLeft', 'Days left')]:     a.daysUntilExpiry ?? '',
  [ta('export.col.status', 'Status')]:          statusLabel(a),
  [ta('export.col.risk', 'Risk')]:              a.riskLevel || '',
  [ta('export.col.value', 'Value')]:            a.value ?? '',
  [ta('export.col.currency', 'Currency')]:      a.currency || '',
  [ta('export.col.payment', 'Payment terms')]:  a.paymentTerms || '',
  [ta('export.col.owner', 'Owner')]:            a.owner?.name || '',
  [ta('export.col.archiveNo', 'Archive No.')]:  a.archiveNumber || '',
  [ta('export.col.confidentiality', 'Confidentiality')]: a.confidentiality || '',
  [ta('export.col.driveLink', 'Drive link')]:   a.driveLink || '',
});

// Approx. character widths per column, in row order.
const COL_WIDTHS = [16, 5, 12, 24, 26, 26, 18, 24, 16, 14, 12, 12, 12, 9, 16, 8, 12, 9, 14, 18, 12, 16, 30];

/**
 * Export a list of agreements (already permission-scoped + filtered on screen) to .xlsx.
 * @param {Array} agreements
 * @param {string} sectorKey  active sector value, or '' for all sectors
 */
export const exportAgreementsToExcel = async (agreements, sectorKey = '') => {
  // Load SheetJS on demand so it stays out of the main bundle.
  const XLSX = await import('xlsx');
  const rows = agreements.map(toRow);
  const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  ws['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, ta('export.sheetName', 'Contracts'));

  const scope = sectorKey ? tDept(sectorKey) : ta('list.allSectors', 'All sectors');
  const stamp = new Date().toISOString().slice(0, 10);
  const safeScope = String(scope).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  XLSX.writeFile(wb, `${ta('export.fileBase', 'contracts')}_${safeScope}_${stamp}.xlsx`);
};
