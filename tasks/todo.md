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
