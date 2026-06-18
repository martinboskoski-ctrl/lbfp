# Contracts: rename sidebar + Excel export

Goal: (1) rename the sidebar entry "Систем за управување со договори" → "Договори"
(EN: "Contracts"); (2) let top management (all sectors) and sector managers (own
sector) export the contract register to Excel (.xlsx).

Scope decided with user: **Excel only** (slides / Google Drive deferred). Export the
**current filtered view** (active sector tab, search, status, doc-type, signed-date
range). All client-side — the list is already permission-scoped server-side, so the
export simply mirrors what's on screen.

## Plan
- [x] Install `xlsx` (SheetJS) in client — write-only usage, no parse path
- [x] Rename sidebar label: `common.json` mk → "Договори", en → "Contracts"
- [x] New util `client/src/utils/exportAgreements.js` — maps agreement rows to a
      localized sheet (Sector, №, Type, Class, Name, Counterparty, contact, Category,
      Signed/Start/End, Days-left, Status, Risk, Value+Currency, Payment, Owner,
      Archive №, Confidentiality, Drive link) and triggers .xlsx download
- [x] Add "Export to Excel" button on `Agreements.jsx`, gated on `canManage(user)`,
      exporting the already-computed `filtered` array; toast when 0 rows
- [x] i18n: `list.exportExcel`, `list.exportEmpty`, `export.col.*` headers (mk + en)

## Verify
- [x] `npm run build --prefix client` passes (xlsx code-split to its own 429kB chunk)
- [x] Lint changed files — exportAgreements.js clean; only pre-existing `Icon`
      false-positive on Agreements.jsx:54 (present on HEAD, Icon is actually used)
- [x] JSON key parity mk vs en for agreements ns — none missing either side
- [ ] Manual: button visible only to managers/top mgmt; file opens with Cyrillic intact
      (needs a logged-in browser session — code path verified, build green)

## Review
- Sidebar entry renamed via the existing `common.agreements` key → mk "Договори" /
  en "Contracts" (no component change needed; Sidebar already uses t('agreements')).
- Export is fully client-side: reuses the on-screen, already-permission-scoped
  `filtered` array, so it honours the active sector tab + search + status + doc-type +
  signed-date filters with zero new server work. Top mgmt exporting "all sectors" gets
  a Sector column; managers get their own sector only.
- `xlsx` is dynamically `import()`-ed inside the util so it loads only on first export
  and stays out of the main bundle (main went 1920kB → 1634kB; xlsx is a 429kB lazy
  chunk). Headers/labels localized through i18next; dates written as real Date cells.
- Button gated on `canManage(user)` (manager OR top management) — employees don't see it.
- Deferred per user decision: Slides (.pptx) export and direct Google Drive OAuth upload.

## Follow-up — styled, multi-sheet workbook
- Swapped `xlsx` (SheetJS free build can't style cells) → `exceljs`.
- One worksheet per sector (sheet name = localized dept); managers get a single sheet,
  top mgmt "all sectors" gets one tab each.
- Per sheet: merged title band (sector · count · date), dark header row (frozen,
  auto-filter), zebra striping, thin borders, date/number/money formats, status &
  risk cells color-coded, Drive link as a real hyperlink.
- `exceljs` is dynamically imported → lazy 937kB chunk, main bundle unchanged (1637kB).
- Build green, util lints clean, mk/en key parity holds (added `export.titleLine`,
  removed now-unused `export.sheetName`).
