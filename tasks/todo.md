# Feature: Амбалажа (Packaging compliance)

Under "Барања од клиенти". Visible to: top_management, sales, quality_assurance,
nabavki, r_and_d (== existing `showInquiries` set).

## Decisions (confirmed)
- AI provider: **user-supplied custom endpoint** (need API details).
- Regulation source: **full regulation texts** loaded as AI context.
- Image storage: **do not persist** — transient to AI; store only extraction + report.
- Timing: **synchronous** (user waits for the report).

## Flow
Upload image (drag & drop) → backend receives in-memory → AI vision extracts
structured content → AI compliance step checks extraction against EU regulation
texts → structured report returned & saved (report only, no image).

## Backend
- [ ] `models/PackagingAssessment.js` — createdBy, department, title, status,
      extraction{}, compliance{ overall, items[], summary }, model, tokensUsed, timestamps
- [ ] `services/ai.js` — wrapper for the user's custom provider (endpoint, key, model, format)
- [ ] `services/packagingCompliance.js` — vision-extract prompt + compliance prompt,
      injects regulation text from `server/src/data/regulations/`
- [ ] `data/regulations/` — the regulation texts the user provides
- [ ] `controllers/packaging.controller.js` — POST / (multipart, multer memoryStorage),
      GET /, GET /:id, POST /:id/reanalyze, DELETE /:id; dept-scoped like agreements
- [ ] `routes/packaging.routes.js` + mount `/api/packaging` in `app.js`

## Frontend
- [ ] `pages/Packaging.jsx` + `components/packaging/*` (native HTML5 dropzone, preview, progress)
- [ ] Results UI: extraction summary + compliance cards (pass / warning / fail + fix)
- [ ] `api/packaging.api.js`, `hooks/usePackaging.js` (TanStack Query, mirror useAgreements)
- [ ] Sidebar: `Амбалажа` nav item under inquiries block, `showInquiries` gating
- [ ] Route `/packaging` in App.jsx (+ dept guard)
- [ ] i18n `mk`/`en` `packaging.json`

## Blocked on user (see handoff list)
- AI endpoint details (URL, key, model, request/response format, vision support)
- Regulation texts (files) + which regs + language
- Packaging/product scope
- Report language (MK/EN)
- Allowed image types + max size

## Review
(to be filled after implementation)
