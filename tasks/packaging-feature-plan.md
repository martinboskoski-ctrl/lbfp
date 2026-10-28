> **SUPERSEDED (2026-10-28):** replaced by the multi-sector "Проверка на амбалажа"
> tool — see `tasks/todo.md`. Kept for history only.

# Амбалажа (Packaging Compliance) — Feature Plan & Resume Doc

> **Purpose of this file:** self-contained handoff. When re-opened in a new
> session, reading this alone is enough to continue. Status is tracked in the
> **Progress** section at the bottom — start there.

---

## 1. What we're building

A new feature **"Амбалажа"** placed **under "Барања од клиенти"** in the sidebar.

The user:
1. **Drags & drops a packaging image** into the page.
2. **AI reads the image content** (materials, on-pack text, symbols, recycling
   codes, weights, food-contact declarations, responsible entity, language…).
3. **AI checks compliance** against applicable **EU packaging regulations** and
   returns a structured report (pass / warning / fail per requirement, with
   findings + recommended fixes + citations to the regulation text).

**Visible to (departments):** `top_management`, `sales`, `quality_assurance`,
`nabavki`, `r_and_d` — identical to the existing `showInquiries` set in
`client/src/components/layout/Sidebar.jsx`. Reuse that gating.

**Framing:** results are **decision-support, not legal sign-off** — present as
"flagged for review" with citations; QA/legal makes the final call.

---

## 2. Confirmed decisions

| Topic | Decision | Implication |
|---|---|---|
| AI provider | **User-supplied custom endpoint** | Need endpoint URL, key, model, API format. Build thin `services/ai.js` wrapper. |
| Regulation source | **Full regulation texts as AI context** | Load from `server/src/data/regulations/`, feed relevant content to the model (add section-retrieval if texts are large). |
| Image storage | **Do NOT persist the image** | Receive in-memory (multer memoryStorage), base64 → AI, store only extraction + report. No S3/AWS needed. |
| Analysis timing | **Synchronous** | User waits ~10–30s; no job queue / polling. |

---

## 3. Codebase facts (already researched)

- **Sibling feature** "Барања од клиенти" = Inquiries (`pages/Inquiries.jsx`,
  `po`/`leads` modules). Its `showInquiries` visibility set == the 5 target depts.
- **No AI integration exists yet** — this is net-new (needs an API key).
- **S3 is NOT configured** — `server/.env` has placeholder AWS keys
  (`your_access_key_id`). Irrelevant now since we don't store images.
- **Access-control pattern to mirror:** `server/src/controllers/agreement.controller.js`
  (dept-scoped: top mgmt sees all, others see own dept). Top-mgmt check =
  `u.department === 'top_management'`.
- **Client data pattern to mirror:** `hooks/useAgreements.js` (TanStack Query,
  `invalidateQueries` on parent key), `api/agreements.api.js`, i18n `mk`/`en`.
- **multer** is already a server dependency (use `memoryStorage`).
- Native HTML5 drag-and-drop — **no new npm dep needed** (no react-dropzone).
- Auth: JWT, `authenticate` middleware attaches `req.user`. Route mounts in
  `server/src/app.js`. Client routes + `ProtectedRoute` in `client/src/App.jsx`.

---

## 4. Build steps

### Backend
- [ ] `server/src/models/PackagingAssessment.js`
      — `createdBy`, `department`, `title`, `status` (analyzing|analyzed|failed),
        `extraction{}`, `compliance{ overall, items[{ regulationRef, title,
        status, severity, findings, recommendation }], summary }`,
        `model`, `tokensUsed`, timestamps, optional `activityLog`.
- [ ] `server/src/services/ai.js` — wrapper for the user's custom provider
      (endpoint, key, model, request/response format, image attach method).
- [ ] `server/src/services/packagingCompliance.js` — two prompts:
      (1) vision extraction → structured JSON; (2) compliance → report using
      regulation text as grounding.
- [ ] `server/src/data/regulations/` — regulation texts the user provides.
- [ ] `server/src/controllers/packaging.controller.js` — dept-scoped:
      `POST /` (multipart image, in-memory) → extract → comply → save report;
      `GET /` (list), `GET /:id`, `POST /:id/reanalyze`, `DELETE /:id`.
- [ ] `server/src/routes/packaging.routes.js` + mount `app.use('/api/packaging', …)`.

### Frontend
- [ ] `client/src/pages/Packaging.jsx` + `client/src/components/packaging/*`
      — native drag-and-drop dropzone, image preview, upload progress.
- [ ] Results UI — extraction summary + compliance cards (pass/warn/fail + fix).
- [ ] `client/src/api/packaging.api.js`, `client/src/hooks/usePackaging.js`.
- [ ] Sidebar — `Амбалажа` NavItem under the inquiries block, `showInquiries` gating.
- [ ] Route `/packaging` in `App.jsx` (+ client-side dept guard).
- [ ] i18n `client/src/i18n/locales/{mk,en}/packaging.json`.

---

## 5. NEEDED FROM USER (blockers) — provide these to resume

1. **AI endpoint details** *(critical)*:
   - Endpoint URL (e.g. `https://…/v1/chat/completions`)
   - API key → goes in `server/.env` (e.g. `AI_API_KEY=…`), kept local/not pushed
   - Model name — **must accept images (vision)**; confirm.
   - API format — **OpenAI-compatible**, **Anthropic Messages**, or custom?
     (decides request shape + how image is attached: base64 vs URL)
   - Any special auth header, rate/size limits.
2. **Regulation texts** — the files (PDF/txt/md), which regulations, and language.
   Candidates: PPWR (EU) 2025/40, Dir 94/62/EC, Reg (EC) 1935/2004,
   Reg (EU) 10/2011 (plastics FCM), REACH SVHC. → placed in
   `server/src/data/regulations/`. Flag if total size is large (add retrieval).
3. **Packaging/product scope** — materials & products (e.g. food-contact wafer
   packaging, plastic film, cartons) → selects regulation subset + prompt.
4. **Report language** — MK / EN / both (default: MK to match UI).
5. **Image constraints** — allowed types (JPG/PNG/WebP/PDF?) + max size.

*Items 3–5 have sensible defaults; only 1 & 2 are hard blockers.*

---

## 6. Progress / Resume here

**Status:** 🟡 Planning complete — awaiting user inputs (Section 5, items 1 & 2).
Nothing built yet.

**Next action when resumed:**
1. Read this file + confirm Section 5 inputs are provided.
2. If AI endpoint (item 1) + regulation texts (item 2) are in → start Backend
   steps (Section 4) top-to-bottom, then Frontend.
3. If still missing → re-prompt user for the specific missing item(s) only.

**Change log:**
- 2026-09-21 — Plan created; decisions in Section 2 confirmed via user.
