# Проверка на амбалажа — working plan

> Living document for the packaging-artwork check tool. Update the **Progress**
> and **Open questions** sections as we go. Supersedes
> `tasks/packaging-feature-plan.md` (old solo "Амбалажа" idea).

---

## 1. Purpose

A client sends label / packaging artwork. Before we confirm it, it must be checked
against **the product's ingredient list** and **our labelling rules** (mandatory
content, language, minimum font size, order of the nutrition table, …).

Today Sales chases R&D, Набавки and Quality ad hoc by email/phone. Problems slip
through (a wrong printed label is expensive), and nobody sees what was checked,
by whom, and what is still open.

The tool turns this into **one tracked process**:
- AI does a fast first pass against *our* checklist and raises remarks.
- Every remark is routed to the **sector responsible** for it, which must confirm it.
- **Sales leads**: sees the whole picture and gives the client one answer.
- Full history: who confirmed what and when, per round of artwork.

## 2. Who does what

| Role | Can |
|---|---|
| **Sales** (lead) | start a check, upload new rounds, add remarks, close a round (Одобрено / Потребни корекции) |
| **R&D, Набавки, Quality** | see all checks, confirm/dispute remarks for their own sector, add remarks |
| **Quality + top management** | maintain the checklist rules |
| **Top management** | everything; may close a round even with unanswered remarks |

Visible only to: `sales`, `r_and_d`, `nabavki`, `quality_assurance`, `top_management`.
Sidebar: **Алатки → Проверка на амбалажа**.

## 3. Decisions (confirmed 2026-10-28)

| Topic | Decision |
|---|---|
| File storage | **MongoDB GridFS** (S3 not set up). Max 15 MB per file. |
| Checklist | Editable in the app by **Quality + top management**; each rule tagged with its responsible sector → AI remarks route automatically |
| Rounds | **Yes** — one check per client + product; corrected artwork = new round; history kept |
| AI provider | **Not available yet.** Single adapter point; until connected, remarks are added manually and the UI shows "AI не е поврзан" |

## 4. Flow

1. **Sales** opens a check: client, product, drag & drop the artwork (JPG/PNG/WebP/PDF)
   + the ingredient list (pasted text and/or a file: PDF, image, DOCX, TXT).
2. **AI** (when connected) reviews artwork ↔ ingredients ↔ active rules → remarks
   `{text, severity: critical|warning|info, sector, rule}`.
3. R&D / Набавки / Quality are **notified**; each sector answers its remarks:
   - ✅ **Потврдено** — valid, artwork needs a correction
   - ❌ **Не е проблем** — explanation required
   - anyone in the tool can add a manual remark for any sector
4. Sales sees per-sector progress; once nothing is pending, **closes the round**
   with an outcome + summary for the client. Sales is notified when all remarks are answered.
5. Client sends corrected artwork → **new round** → re-check. Earlier rounds stay read-only.

## 5. Data model

- **PackagingCheck** — `code` (ПА-0001…), `client`, `product`, `status`
  (`in_review` | `approved` | `changes_required`), `createdBy`, `rounds[]`
- **round** — `number`, `artwork` (GridFS ref), `ingredientsText`, `ingredientsFile`,
  `note`, `createdBy`, `ai {status, summary, error, model, ranAt}`, `remarks[]`,
  `outcome {decision, summary, by, at}`
- **remark** — `text`, `severity`, `sector`, `rule` + `ruleText` snapshot,
  `source` (ai|manual), `createdBy`, `status` (pending|confirmed|disputed),
  `response {comment, by, at}`
- **PackagingRule** — `text`, `category`, `sector`, `active`, `createdBy`

## 6. API (`/api/packaging`)

| Method | Path | Who |
|---|---|---|
| GET | `/` | tool users — list with current-round progress |
| POST | `/` (multipart) | sales, top — new check + round 1 (+ AI) |
| GET | `/:id` | tool users |
| DELETE | `/:id` | creator, top (also deletes files) |
| POST | `/:id/rounds` (multipart) | sales, top — only after the round is closed |
| POST | `/:id/ai` | sales, quality, top — re-run AI (keeps answered remarks) |
| POST | `/:id/close` | sales, top — `{decision, summary}` |
| GET | `/:id/files/:fileId` | tool users — streams from GridFS |
| POST | `/:id/remarks` | tool users |
| PATCH / DELETE | `/:id/remarks/:remarkId` | remark creator, sales, top — pending only |
| POST | `/:id/remarks/:remarkId/respond` | responsible sector, top |
| GET / POST / PATCH / DELETE | `/rules…` | read: tool users · write: quality, top |

## 7. Connecting the AI (the missing piece)

Everything except the provider call is in `server/src/services/packagingAi.js`:
prompt built from the active checklist + ingredient list, artwork (and an image/PDF
ingredient file) attached as base64, reply parsed as JSON, remarks routed by rule
→ sector, invalid values normalised. To connect:

1. Write an adapter: `registerAiProvider('<name>', async ({ apiKey, model, system, prompt, attachments }) => rawText)`
   — `attachments` = `[{ mimeType, base64, label }]`. Must be a **vision** model;
   check the provider accepts PDF, or convert PDF pages to images.
2. Set in `server/.env`: `PACKAGING_AI_PROVIDER`, `PACKAGING_AI_API_KEY`, `PACKAGING_AI_MODEL`.
3. Restart the server — the "AI не е поврзан" notice disappears and new checks/rounds
   are reviewed automatically; "Пушти AI проверка" re-runs on the open round.

Need from you: provider + model name + API key.

## 8. Progress

### Backend
- [x] Models `PackagingCheck`, `PackagingRule`
- [x] GridFS file storage (`services/packagingFiles.js`)
- [x] AI service: prompt, parser, routing, adapter registry (`services/packagingAi.js`)
- [x] Controller + routes, mounted at `/api/packaging`; upload limits & type checks
- [x] Notifications: new check/round → reviewer sectors; new remarks → responsible
      sector; all answered → Sales; round closed → sectors involved
- [x] Integration tests on a throwaway DB — 29/29 workflow + 7/7 AI path (fake provider)

### Frontend
- [x] Sidebar group **Алатки** (gated) → `/tools/packaging`
- [x] List page: status, client/product, round, per-sector pending badges, "Чека мој сектор" filter
- [x] New check page: drag & drop artwork + ingredients (text / file)
- [x] Check detail: artwork viewer, remarks grouped by sector with progress,
      confirm/dispute, add remark, close round, new round, round history, AI status/re-run
- [x] Checklist rules page (edit: Quality + top mgmt)
- [x] `api/packaging.api.js`, `hooks/usePackaging.js`, i18n `packaging.json` (mk/en)
- [ ] **Click-through in the browser** with a Sales, a Quality and a top-mgmt account
      (build + lint pass; not yet viewed — browser automation was unavailable)

### Later / ideas
- [ ] Connect the AI provider (section 7)
- [ ] Seed a starter checklist with Quality (food-labelling basics: name, ingredients
      in descending order, allergens emphasised, net quantity, best-before, storage,
      producer, nutrition table order, min. font size, Macedonian language)
- [ ] Export a round's remarks as PDF for the client
- [ ] Annotate remarks on the artwork (pin a remark to a spot on the image)

## 9. Open questions
- Which AI provider/model? (blocks section 7)
- Who writes the first version of the checklist, and from which regulation/standard?
- Should the client-facing summary be in Macedonian, English, or both?
