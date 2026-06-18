# Translation pass — Phases 1 & 2

Goal: wire hardcoded-Macedonian UI to the existing i18next system so the EN
toggle actually translates these screens. Legal/data content (contract class
taxonomy, stored enum values) stays as-is.

## Phase 1 — Agreements / Contract Management
- [x] Expand `agreements` namespace (mk + en): detail.*, list.*, registerStatus.*,
      docType.*, duration.*, action.*, toast.*, modal field labels & option labels
- [x] `pages/AgreementDetail.jsx` → use `agreements` ns
- [x] `pages/Agreements.jsx` → use `agreements` ns
- [x] `components/agreements/AddAgreementModal.jsx` → finish remaining hardcoded
- [x] `hooks/useAgreements.js` → `i18next.t` for toasts
- [x] `constants/contractRegister.js` → keep CONTRACT_CLASSES MK (legal data);
      components translate doc-type / status / duration via t()

## Phase 2 — Employees (HR dossiers)
- [x] New `employees` namespace (mk + en) + register in i18n.js
- [x] `pages/Employees.jsx`
- [x] `pages/EmployeeDetail.jsx` (UI chrome only; stored enum values left as-is)

## Verify
- [x] `npm run build --prefix client` — passes (4.6s, no errors)
- [x] Lint changed files — Phase 2 clean; Phase 1 only pre-existing findings
      (CATEGORIES react-refresh export, RHF `watch` warning, the `Icon` no-unused-vars
      false-positive that also exists on HEAD). No new errors introduced.
- [x] JSON key parity mk vs en — all 20 namespaces match

## Review
- Phase 1 (Agreements): expanded `agreements` ns (detail/list/modal/registerStatus/
  docType/duration/action/toast). Wired AgreementDetail, Agreements, AddAgreementModal,
  useAgreements. `contractRegister.js` CONTRACT_CLASSES kept Macedonian (legal data
  stored verbatim on `contractClass`); doc-type/status/duration labels now translated
  in-component via t() keyed on value, with the constant label as fallback.
- Phase 2 (Employees): new `employees` ns + registered in i18n.js. Wired Employees +
  EmployeeDetail. Stored enum data values (gender, employmentType, leave/discipline/
  incident statuses, docType, allowance kind, raw `u.department` pill) left as-is —
  those are data, not UI chrome.
- Deferred per user: auto-translating user-entered content (revisit after UI is done).
- Not in scope this pass: toast strings in other hooks (useLhc/useClients/useTasks/
  useLeads/useProjects/useProcedures), Trainings.jsx, Dashboard/HomeDashboard/Pagination/
  Login/EditHistory stray strings, AnticorruptionTraining (authored MK content).
