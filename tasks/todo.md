# Employee card — simplified to one page (2026-10-30)

## Decisions (confirmed 2026-10-30)
- Tabs: **Преглед** (one page) + **Задачи**. All other tabs removed from the card (data stays in DB).
  Requests tab: skipped for now.
- Annual leave is granted per calendar year and usable until **30.06 of the next year**.
  Leave taken Jan–Jun uses the **previous year's remaining days first**.
- Leave entries (from–to, working days, note) are added/deleted by top mgmt + HR; only HR admins change a year's entitlement. Existing `LeaveBalance.usedDays` is kept as
  "recorded earlier" days for that year.
- **Access (added 2026-10-30):** employee cards, the directory and their edits — top management + HR only
  (not the employee, not managers). Same flag (`canViewEmployeeCards`) in the AI assistant's employee tools.
- Discipline: short list on the same page (date, type, reason, active/expired) + simple add form
  (top mgmt + HR); delete — HR admin.

## Backend
- [x] `models/LeaveEntry.js` — user, from, to, days, note, createdBy
- [x] `services/leave.js` — per-year buckets: total, usedInYear, usedNextYear (Jan–Jun), remaining,
      validUntil; FIFO allocation of each entry
- [x] `employeeFile.js` — include `leave` summary + entries; permissions canManageLeave / canEditEntitlement / canAddDiscipline
- [x] Routes: POST/DELETE `/employees/:id/leave[/:entryId]`, PUT `/employees/:id/leave/entitlement/:year`,
      POST/DELETE `/employees/:id/discipline[/:actionId]`

## Frontend
- [x] `EmployeeDetail.jsx` — header + 2 tabs; overview = profile, leave, discipline
- [x] `components/employee/LeaveCard.jsx`, `DisciplineCard.jsx`; hooks + API; i18n mk/en

## Verification
- [x] Unit check of the leave allocation (carry-over, expiry, legacy usedDays)
- [x] Throwaway-DB test of the endpoints + permissions; client lint + build

## Review (2026-10-30)
- Leave rules: 9/9 unit cases (carry-over Jan–Jun, expiry after 30.06, legacy usedDays, default 20, overdraw).
- Endpoints + access: 25/25 on a guarded throwaway DB — employee / same-dept manager get 403 on card,
  list and edits; HR staff open + manage; only HR managers / top mgmt change entitlement or delete
  discipline; AI `search_employees` / `get_employee_file` denied, `company_overview` headcount null
  for non-HR; HR gets the leave summary through the AI.
- Client: lint clean on changed files (EmployeeTasksTab / Sidebar errors pre-exist on main), build OK,
  all i18n keys present mk + en. Not verified visually (Chrome extension not connected).
- Tasks tab shown to top management only: the task API scopes non-top-mgmt to their own department.

---

# Packaging check v2 — one shared client email instead of remark cards (2026-10-30)

## Goal
Replace the per-remark Потврди / Не е проблем cards with ONE draft email per round,
grouped into department paragraphs. Departments edit/comment/approve their paragraph
in the app; Sales (lead) sends the finished email.

## Decisions (confirmed 2026-10-30)
| Paragraph | Owner (edits + approves) | Covers |
|---|---|---|
| R&D | r_and_d | nutrition facts, recipe, ingredients, additives, claims |
| Graphics | nabavki | dimensions, sizes, x-height, legibility, print/technical, material marks |
| Quality | quality_assurance | compliance, legal particulars, allergens, dates, language, wording vs nutrition facts |
| General | quality_assurance | grammar, spelling, wording, consistency, other technical |
- Paragraph with no remarks → left out of the email (owner still approves "nothing from us").
- Owner dept (+ top mgmt) edits/approves its paragraph; everyone else comments/suggests.
- Sales edits the opening (incl. AI answer to the client's question) and closing.
- Per-remark cards removed — email only.

## Email shape (English, goes to the client)
```
Dear <client> team,
Thank you for sending the artwork for <product> (target markets: …). Our feedback:

The remarks from our R&D department are:
- QUID for peanuts is missing; state it in the ingredient list, e.g. "peanuts (18%)".
- Nutrition is given per portion only; add values per 100 g (EN + AR).

The remarks from our Graphics department are:
- …
The remarks from our Quality department are: …
General remarks (grammar, wording): …

Once updated, please send the revised artwork and we will review it again.
Kind regards, <sales user> · LBFP DOO Bitola
```

## Data model — `round.email` replaces `round.remarks`
```
email: {
  opening, closing: String,                   // Sales
  sections: [{ key: 'rnd'|'graphics'|'quality'|'general', sector,
               items: [String],                // one short sentence each
               edited: Boolean,                // a person changed it → AI re-run keeps it
               approval: { by, at },           // cleared by any later edit
               comments: [{ text, by, at }] }],
  sent: { text, by, at }                       // snapshot of what Sales sent
}
```
All four sections always exist (so a dept can add what the AI missed).

## Backend
- [x] `PackagingCheck.js`: add `email` subdoc, drop `remarks`; `EMAIL_SECTIONS` constant (key → sector)
- [x] `packagingAi.js`: prompt returns `{summary, answer, sections: {rnd:[], graphics:[], quality:[], general:[]}}`
      — one short, clear sentence per remark; "missing" particulars become sentences in the right section;
      rules keep their sector → section hint
- [x] `runAi`: fills opening (+answer) and sections; re-run only replaces sections that are not `edited`/approved
- [x] Routes (replace remark routes):
      `PATCH /:id/email` (opening/closing, Sales) · `PATCH /:id/email/sections/:key` (items, owner; clears approval)
      `POST /:id/email/sections/:key/approve|unapprove` (owner) · `POST /:id/email/sections/:key/comments` (anyone in tool)
- [x] `close` → "send": requires every section approved (top mgmt may override), stores `sent` snapshot + decision
- [x] Conversation history for the AI = previous rounds' sent email (instead of confirmed/disputed remarks)
- [x] Notifications: draft ready → R&D/Набавки/Quality; comment → section owner; all approved → Sales
- [x] List rows: `pendingBySector` = sectors that have not approved yet
- [x] One-off migration script: existing rounds' non-disputed remarks → sections (by sector), approval if confirmed

## Frontend
- [x] New `EmailDraft` component: opening, 4 section cards (owner: edit textarea one-remark-per-line,
      Одобри/Повлечи; others: comment box; comments thread under each), closing, live preview,
      approval chips per dept, Copy + Испрати (close round) for Sales
- [x] Delete `RemarkCard`, `AddRemarkForm`, `clientEmail.js`/`ClientEmail` (logic moves into EmailDraft builder), SectorProgress → approval chips
- [x] Hooks/API for the new endpoints; i18n mk/en; `CloseRoundModal` gated on approvals
- [x] Rules page unchanged (sector still routes AI remarks)

## Verification
- [x] Server: throwaway-DB script — create check with fake AI → sections filled; owner edit clears approval;
      non-owner edit 403; comment notifies; send blocked until all approved; re-run keeps edited sections
- [ ] Browser click-through on check 6ae44c7f… as Sales, R&D, Набавки, Quality (Chrome extension was not connected)

## Review (2026-10-30)
- Server: throwaway-DB test (guarded `dbName`, drops only its own DB) — 23/23 checks of the workflow
  (AI fills paragraphs, empty paragraph left out, owner-only edit, edit clears approval, comments +
  notifications, opening/closing, re-run keeps edited, send blocked until approved, sent snapshot,
  history to the next AI round). Script: scratchpad `email-flow.test.mjs`.
- Client: eslint clean on packaging files, `npm run build` OK, every `t('…')` key resolves in mk + en.
- Migration ran on the dev DB: ПА-0001 → R&D 6 / Graphics 3 / Quality 10 / General 0, all awaiting
  approval; old `remarks` left in the DB. Migrated texts are the old long AI remarks — "Пушти AI
  проверка" rewrites untouched paragraphs in the new short, regrouped form.
- Not verified: visual click-through in the browser.
- Removed: RemarkCard, AddRemarkForm, ClientEmail, clientEmail.js, styles.js, /remarks routes.

---

> **Working plan:** `tasks/packaging-check-plan.md` — progress and decisions are
> tracked there; this section is the short summary.

# Feature: Проверка на амбалажа (Packaging artwork check)

Sidebar: **Алатки → Проверка на амбалажа**. Supersedes the earlier solo
"Амбалажа" plan (`tasks/packaging-feature-plan.md`), which hung off the removed
"Барања од клиенти" feature.

## Problem
Client label/packaging artwork must be checked against the product's ingredient
list and our labelling rules (mandatory content, language, font size, order of
nutrition facts). Today Sales chases R&D / Набавки / Quality ad hoc — no single
view of what was checked, by whom, what is still open.

## Roles
| Who | Can |
|---|---|
| Sales (lead) | create checks, upload rounds, add remarks, close a round (Одобрено / Потребни корекции) |
| R&D, Набавки, Quality | see all checks, confirm/dispute remarks for their sector, add remarks |
| Quality + top mgmt | maintain the checklist rules |
| Top management | everything, incl. closing with open remarks |
Visible only to: sales, r_and_d, nabavki, quality_assurance, top_management.

## Decisions (confirmed 2026-10-28)
- Files (artwork, ingredient-list file) stored in **MongoDB GridFS**, max 15 MB.
- Checklist rules maintained by **Quality + top management**, each tagged with
  the responsible sector → AI remarks route automatically.
- **Rounds**: one check per client+product; corrected artwork = new round,
  history kept.
- AI provider not available yet → single adapter (`services/packagingAi.js`);
  until configured the UI says "AI не е поврзан" and remarks are added manually.

## Flow
1. Sales: client, product, drag & drop artwork (+ ingredient list as text and/or file).
2. AI (when configured) checks artwork vs ingredients vs active rules → remarks
   {text, severity, sector, rule}.
3. Each sector notified; per remark: Потврдено (needs correction) or
   Не е проблем (comment required).
4. Sales sees per-sector progress; when nothing is pending, closes the round
   with an outcome + summary for the client.
5. Corrected artwork → new round → re-check.

## Backend
- [ ] `models/PackagingCheck.js` — code, client, product, status, rounds[{ number,
      artwork, ingredientsText, ingredientsFile, ai{status,error,summary,model,ranAt},
      remarks[{text, severity, sector, rule, ruleText, source, createdBy, status,
      response{comment,by,at}}], outcome{decision,summary,by,at} }]
- [ ] `models/PackagingRule.js` — text, sector, category, active, order
- [ ] `services/packagingFiles.js` — GridFS put/stream/delete
- [ ] `services/packagingAi.js` — prompt builder + response parser + provider adapter (stub)
- [ ] `controllers/packaging.controller.js` + `routes/packaging.routes.js`, mount `/api/packaging`
- [ ] Notifications via `services/notification.js`

## Frontend
- [ ] Sidebar group "Алатки" (gated) → `/tools/packaging`
- [ ] Pages: list, new check, check detail (artwork + remarks by sector + progress), rules
- [ ] `api/packaging.api.js`, `hooks/usePackaging.js`, i18n `packaging.json` mk/en

## Review (2026-10-28)
- Backend + frontend built; details and progress in `tasks/packaging-check-plan.md`.
- Verified: server integration tests on a throwaway DB (29/29 workflow, 7/7 AI path
  with a fake provider); client build + lint clean for all new files.
- Not yet verified: visual click-through in the browser.
- Remaining: connect the AI provider (plan §7); seed the first checklist with Quality.
