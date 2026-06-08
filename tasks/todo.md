# Contract Management Register — Implementation Plan

Source of truth: `Процедура_за_управување_со_договори.docx` + `Регистар_на_договори_ЛБФП (2).xlsx`.

## Decisions (confirmed with user)
- **Edit rights:** managers + top management only (unchanged). Everyone can now VIEW all sectors (read-only).
- **Financial fields:** keep all existing (value/currency/payment/risk). New register fields are additive.
- **Sector mapping:** add a NEW department `safety` (Безбедност и сертификации) = procedure sector 10. Map `administration`→Finance class list, `carina`→Nabavki class list.

## Sector → class-list mapping (from xlsx "Шифрарник")
sales · finance(+administration) · hr · nabavki(+carina) · machines · facility · production · quality_assurance · r_and_d · safety(NEW)

## Tasks

### 1. New department `safety`
- [ ] `server/src/models/User.js` — add `safety` to DEPARTMENTS enum
- [ ] `server/src/models/Agreement.js` — add `safety` to DEPARTMENTS enum
- [ ] `client/src/components/layout/Sidebar.jsx` — add `{ value:'safety', icon: ShieldAlert }`
- [ ] `client/src/i18n/locales/{mk,en}/common.json` — add `dept.safety`

### 2. Server data model (`Agreement.js`)
- [ ] Add fields: `documentType` (contract|annex|other), `contractClass` (String), `durationType` (fixed|indefinite), `archiveNumber` (String), `driveLink` (String), `reviewDate` (Date), `reviewComment` (String), `sequenceNumber` (Number, per-dept)
- [ ] Expand `status` enum: add `negotiating`, `for_renewal`, `renewing`, `archived` (keep draft/active/terminated/renewed)
- [ ] Relax required: `title` & `startDate` → optional. Keep `otherParty` required.
- [ ] Update `effectiveStatus` virtual: manual statuses pass through; only `active` gets date overlay

### 3. Server controller (`agreement.controller.js`)
- [ ] `ALLOWED_FIELDS` += new fields
- [ ] `createAgreement`: require only `otherParty`; auto-assign `sequenceNumber`; default title from class/otherParty if blank
- [ ] `listAgreements` / `getAgreement`: allow ALL authenticated users to read ALL sectors; keep `confidential` items restricted to dept+owner+mgmt
- [ ] Edit/delete/renew/terminate stay gated to managers of that dept (unchanged)

### 4. Client constants
- [ ] New file `client/src/constants/contractRegister.js`: `CONTRACT_CLASSES`, `DOCUMENT_TYPES`, `REGISTER_STATUSES`, `DURATION_TYPES`, `deptToClassKey()`

### 5. Register table UI (`pages/Agreements.jsx`)
- [ ] Replace card list with a REGISTER TABLE (scrollable) matching procedure columns
- [ ] Sector tabs/selector; managers edit own sector, everyone views all
- [ ] Keep stat cards + search/filters; row click → `/agreements/:id`

### 6. Modal (`AddAgreementModal.jsx`)
- [ ] Add documentType, contractClass (dept-driven), archiveNumber, driveLink, reviewDate, reviewComment, status, durationType
- [ ] title optional; otherParty required; value/risk/payment collapsed into "Дополнително"

### 7. Detail page (`AgreementDetail.jsx`)
- [ ] Surface new register fields + new statuses

### 8. i18n (`agreements.json` mk + en)
- [ ] New statuses, document types, register column/field labels

### 9. Verify
- [ ] `npm run lint --prefix client` + `npm run build --prefix client`
- [ ] Manual smoke: create as manager, view cross-sector, class dropdown per sector

## Review

Implemented in full:
- **`safety` department** added to `User.js` + `Agreement.js` enums, `Sidebar.jsx` (ShieldAlert icon), and dept labels in `common.json` (mk: "Безбедност и сертификации", en: "Safety & Certifications").
- **Agreement model**: added `documentType`, `contractClass`, `durationType`, `archiveNumber`, `driveLink`, `reviewDate`, `reviewComment`, `sequenceNumber`. Status enum expanded (negotiating/for_renewal/renewing/expired/archived). `title` & `startDate` now optional; `otherParty` stays required. `effectiveStatus` virtual now only overlays date logic on plain `active`.
- **Controller**: read access opened to all sectors (confidential still restricted to dept+owner+mgmt); `dept` query param honored for everyone; create requires only `otherParty`, auto-assigns per-sector `sequenceNumber`, derives a title fallback.
- **Constants** `contractRegister.js`: per-sector class lists from the Шифрарник, document types, statuses, duration types, `deptToClassKey` (administration→finance, carina→nabavki).
- **Register table** (`Agreements.jsx`): sector tabs (own sector marked), scrollable table with procedure columns, stat cards, search + status filter, Drive link, row→detail. Managers add to their sector; top mgmt picks any.
- **Modal**: register essentials up top (type/class/counterparty/dates/duration/review/archive/Drive/owner/auto-renew), financial+risk+contact collapsed into "Дополнително". Class dropdown driven by sector. title optional.
- **Detail page**: surfaces all register fields + review comment + Drive link; new status labels.

Verification:
- `npm run build --prefix client` → ✓ built (2771 modules, no errors).
- `node --check` on the 3 server files → all OK.
- Lint: only pre-existing repo-wide patterns (Fast-refresh export warnings, `icon: Icon` false-positive — identical to committed `EmployeeTasksTab.jsx`). No new blocking errors.

Not done / notes:
- No DB-backed runtime smoke test (needs Mongo + env); compile-time verification only.
- Existing contracts keep working — new fields optional/additive; legacy `category` retained in the "Дополнително" section.
- Dead, unused `AgreementsPage.jsx` left untouched.

---

# Trello-style Task Management + Unified Sector Menu

Plan file: ~/.claude/plans/validated-marinating-parrot.md

## Decisions (confirmed with user)
- Menu: one unified line bar — Тековни задачи · Проекти · Теркови · Потенцијални клиенти · Вработени · Процедури. Tasks first + default view.
- Create rights: managers/top-mgmt only. Owner (assignee) drags own card между todo/in_progress/done only.

## Done
- [x] Server `listTasks`: team-wide visibility — employees now see whole department (assignedTo stays an optional narrowing filter for "Мои задачи").
- [x] Server `updateStatus`: accepts a direct target `status` (drag&drop) alongside legacy `direction`; manager-only into/out of `approved`; dragging into Одобрено sets approvedBy/At.
- [x] Installed `@hello-pangea/dnd` (React 19 compatible).
- [x] `useSetTaskStatus` hook with optimistic cache update (no-flicker drag); `updateStatusApi` now takes a payload object.
- [x] KanbanBoard: DragDropContext + permission-aware onDragEnd, search + "Само мои" toggle, Нова задача gated to managers, full-height horizontal board.
- [x] KanbanColumn: Droppable with drag-over highlight; removed show-more paging.
- [x] TaskCard: Draggable (isDragDisabled when not movable), drag-lift styling, priority left-accent; removed ◀▶ arrows.
- [x] TaskDetailModal: status pill group via useSetTaskStatus (employees see 3 lanes, managers 4); removed arrow/approve footer.
- [x] Dashboard: unified nav line bar, default tab = tasks.
- [x] i18n keys (mk+en): searchPlaceholder, onlyMine, moveNotAllowed, statusLabel, dropHere.

## Verification
- `npm run build --prefix client` ✓; lint — no NEW errors (pre-existing set-state-in-effect untouched); `node --check` + server boot ✓.
- Not done: live multi-login DnD smoke test (needs Mongo + two accounts).

---

# Sales Clients (CRM-lite) — clients, orders & overview

Plan file: ~/.claude/plans/validated-marinating-parrot.md
Mirrors the Leads feature end-to-end.

## Decisions (confirmed with user)
- Client status: active / prospect / inactive (Активен/Потенцијален/Неактивен).
- Order: description, forecastEUR, itemCount, status (forecast→confirmed→delivered→cancelled), date.
- Clients separate from Leads for now (lead→client conversion is a later follow-up).

## Done
- [x] Server `models/Client.js`: embedded orders + activities; virtuals forecastTotal/deliveredTotal/itemTotal/openOrderCount.
- [x] Server `controllers/client.controller.js`: list/create/update/delete + add/update/delete order + addActivity. Sales+top access; non-managers own-only; managers reassign/delete. Status change auto-logs a status_change activity.
- [x] `routes/client.routes.js` + mounted `/api/clients` in app.js.
- [x] Client `api/clients.api.js`, `hooks/useClients.js` (invalidate ['clients']).
- [x] `components/clients/ClientsPage.jsx` — overview stat cards (total/active/forecast EUR/delivered EUR/items) + search/status filter + client cards.
- [x] `components/clients/AddClientModal.jsx` (create/edit) and `ClientDetailModal.jsx` (orders table w/ inline add + per-order status/delete, activity log). Esc + backdrop close.
- [x] i18n `clients.json` (mk+en) registered; `tabs.clients` added to dashboard.json.
- [x] Dashboard: `Клиенти` nav item (sales/top, before Потенцијални клиенти) + ClientsPage render branch.

## Verification
- `node --check` all server files ✓; server boots with routes mounted, no errors.
- `npm run build --prefix client` ✓. Lint clean except one `Icon` no-unused-vars false-positive that mirrors LeadsPage's StatCard (accepted repo pattern).
- Not done: live DB smoke test (needs Mongo + a sales/top login).

## Future
- Convert won lead → client; charts/trend in overview; per-rep breakdown; order line-items.
