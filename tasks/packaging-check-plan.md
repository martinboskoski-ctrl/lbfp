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

## 7. Connecting the AI — OpenAI

Provider chosen: **OpenAI** (Responses API). Adapter: `server/src/services/aiProviders/openai.js`,
registered as `openai` in `services/packagingAi.js`.
- Artwork / ingredient images → `input_image` (base64 data URL, `detail: high`);
  PDFs → `input_file` (no conversion needed; vision model required, 50 MB per request).
- Reply forced into the remark schema with Structured Outputs (`json_schema`, strict).
- API errors, refusals and incomplete replies are recorded on the round as
  "AI проверката не успеа: …" — remarks are never lost.

**To switch it on** — `server/.env` already has:
```
PACKAGING_AI_PROVIDER=openai
PACKAGING_AI_MODEL=gpt-4.1
PACKAGING_AI_API_KEY=            ← paste the key here
```
then restart the server. Any vision-capable model on your account works; change
`PACKAGING_AI_MODEL` to use another. For production, set the same three variables
on the server host. Never commit the key (`.env` is gitignored).

## 7b. Following the real conversation (2026-10-29)

A check follows the client conversation instead of a fixed form:
- **Nothing is mandatory** — client, product, files, ingredients, message are all optional.
- **A round = one client message**: a question, new images, corrected artwork, or any mix.
  New rounds can be added any time; the latest round is active, earlier ones are history.
- **Up to 10 files per round** (JPG/PNG/WebP/PDF, 15 MB each), shown as a gallery.
- The AI uses the **latest artwork and ingredient list given anywhere** in the conversation,
  plus a text history of earlier rounds (client messages, confirmed / dismissed points,
  earlier answers, closing decisions), and **answers the client's question** (`ai.answer`).
- The client email includes that answer and is **editable** before copying (with reset).
- Existing data migrated: `round.artwork` → `round.attachments[0]`.

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
- [x] OpenAI adapter written and tested against a mocked API (10/10)
- [ ] Paste the API key + first real check with a real label
- [x] EU checklist: 47 English rules (1169/2011, 1924/2006, 432/2012, 1333/2008, 1334/2008, 828/2014,
      2018/848, 2018/775, 2019/649, 1935/2004, 10/2011, PPWR 2025/40, Dir 76/211, Dir 2011/91)
      replaced the 20 Macedonian starter rules — **Quality to review**
- [x] AI writes remarks + summary in English; target markets per check; one remark per issue,
      missing particulars grouped per sector; temperature 0.2
- [x] "Email to client" (English, confirmed remarks only, grouped by severity, copy button)
- [x] Proofreading & consistency: 13 more rules (spelling, grammar, diacritics, language-version
      parity, terminology, number formats, placeholders; name/weight/flavour consistency; claim
      numbers vs nutrition table, Annex XIV energy factors; print-technical) → 60 rules total;
      AI proofreads all visible text and quotes "wrong → correct"
- [x] AI reply has a structured `missing` list → the server turns it into ONE critical remark per
      sector ("Mandatory information not visible on the artwork: …") — no per-item duplicates
- [ ] ~~Seed a starter checklist with Quality~~ (food-labelling basics: name, ingredients
      in descending order, allergens emphasised, net quantity, best-before, storage,
      producer, nutrition table order, min. font size, Macedonian language)
- [ ] Export a round's remarks as PDF for the client
- [ ] Annotate remarks on the artwork (pin a remark to a spot on the image)

## 9. Open questions
- AI still sometimes adds "cannot be assessed because missing" remarks on partial artwork; a newer
  model (change `PACKAGING_AI_MODEL`) may follow instructions more strictly — try on real labels.
- Manual remarks are typed by staff — only a placeholder asks for English. Auto-translate them?
- Should the client email also go out from the app (send button), or stay copy-paste?
- ~~Which AI provider/model?~~ → OpenAI (model configurable)
- Who writes the first version of the checklist, and from which regulation/standard?
- Should the client-facing summary be in Macedonian, English, or both?
