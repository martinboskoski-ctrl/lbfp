# Pre-Order Inquiry workflow — implementation plan

Source: `Order #123, ClientName (template).xlsx`. The Excel tracks client questions across the 9-phase NPD process; today this happens in emails and a shared spreadsheet. We digitize it on top of the existing `PurchaseOrder` model, with a **pre-order stage** so a "PO" can exist before a formal order — that's when the most client questions land.

## Decisions

- Keep model name `PurchaseOrder` and route prefix `/po` (no breaking renames). Rename UX label to **Pre-Order Inquiry**.
- Add `stage: 'pre_order' | 'order'`. In `pre_order`, `dateExpected` and `moq` are optional.
- Add 9-phase NPD lifecycle from the Excel `Process Rules` sheet. Each PO has a `currentPhase`; each question is tagged with the phase it was raised in.
- Each (target department × phase) has a **required-fields rubric** — deterministic checklist. The dept can't mark an answer "final" until every required field is filled. Stage-2 AI will score answers against the same rubric.
- Questions become threaded (`thread[]`) for back-and-forth. The dept marks one thread entry `isFinalAnswer: true`.
- Sales reviews the final answer → marks `accepted` or `needs_more`. On accept, sales can mark `sent_to_client`, then log `client_approved` / `client_rejected`.
- Expand `Q_TARGET_DEPTS` with `packaging`. r_and_d users may answer packaging questions (Stage-1 simplification).

## Steps

- [x] 1. Plan doc (this file).
- [x] 2. Extend `server/src/models/PurchaseOrder.js`.
- [x] 3. Create `server/src/config/poRequiredFields.js`.
- [x] 4. Extend `server/src/controllers/po.controller.js` + `routes/po.routes.js`.
- [x] 5. Update `client/src/api/po.api.js` + `client/src/hooks/usePO.js`.
- [x] 6. Update `client/src/components/po/CreatePOModal.jsx`.
- [x] 7. Rewrite `client/src/pages/PODetail.jsx`.
- [x] 8. New `client/src/pages/InquiryInbox.jsx` + sidebar entry.
- [x] 9. Locale updates (en + mk).
- [x] 10. Lint + build pass (no new errors; production build 1.4MB gz 402kB).

## Status pipeline for a question

```
pending → in_progress → awaiting_sales_review → sent_to_client
                              ↘ needs_more (back to in_progress)
                                            ↘ client_approved
                                            ↘ client_rejected (back to in_progress)
```

## Review

**What shipped (Stage 1, no AI yet):**

- `PurchaseOrder` model now carries `stage` (`pre_order` default | `order`) and `currentPhase` (1 of 9 NPD phases). MOQ/dateExpected are optional in `pre_order`, required when sales flips it to `order`.
- Each question carries `phase`, `productRef`, `deadline`, `priority`, a `thread[]` of replies, a `requiredFields[]` rubric seeded from `server/src/config/poRequiredFields.js`, and an extended `status` pipeline: `pending → in_progress → awaiting_sales_review ↔ needs_more → sent_to_client → client_approved | client_rejected`.
- New endpoints under `/api/po`:
  - `POST   /:id/questions/:qid/thread` — anyone in the conversation posts a reply.
  - `PATCH  /:id/questions/:qid/final`  — target dept marks a final answer; **blocked unless every required field is checked**.
  - `PATCH  /:id/questions/:qid/review` — sales accepts (and optionally sends to client) or returns as `needs_more`.
  - `PATCH  /:id/questions/:qid/approval` — sales logs client approval / rejection.
  - `GET    /:id/digest` — auto-generated markdown digest for the client (mirrors the Excel's "Client Email Draft" sheet).
  - `GET    /inbox` — flat dept-scoped list of all open questions across inquiries.
- UX:
  - `CreatePOModal` got a Stage segmented toggle; in pre-order mode MOQ + date are optional. Phase selector added.
  - `PODetail` rewritten: phase + status + priority + deadline chips, threaded replies, required-fields checklist gating "Mark final", sales-review block, client-decision block, "Client digest" button that opens a copyable markdown preview.
  - New `/inquiries/inbox` page lists every question targeting the user's dept with status filter chips. Added to sidebar for sales, QA, R&D, nabavki, packaging, top mgmt.
- `Q_TARGET_DEPTS` extended with `packaging`. R&D users can answer packaging questions; this is the Stage-1 simplification documented in the plan.

**Backwards compat:** legacy `answerQuestion` / `resolveQuestion` endpoints still work and append to the new thread, so any prior data renders fine.

**Why this is the right Stage-1 foundation for Stage-2 AI:**
- The deterministic `requiredFields[]` rubric per (dept × phase) is the same rubric an LLM will score answers against. Stage-2 becomes a single endpoint `POST /:id/questions/:qid/ai-review` plus minor UI — no schema changes.
- The thread + `isFinalAnswer` shape means previous resolved questions on the same product+phase are a ready-made retrieval corpus for "suggest a draft answer".
- The auto-generated digest already produces clean markdown; Stage-2 just runs it through an LLM polish step.

**Tested:**
- Client lint shows no new errors in changed files.
- Production build succeeds (`vite build` clean).
- Server files pass `node --check` syntax validation.

**Not in this slice (next round):**
- Notifications on assignment / deadline / rejection (model + hook in `Notification.js` already exist — wiring left to do).
- Per-question attachments via the existing S3 flow (`useInitiateUpload` / `useConfirmUpload`).
- Stage-2 AI completeness scoring + draft suggestion.
