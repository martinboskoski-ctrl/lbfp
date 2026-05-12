# Top-Management User Management — implementation plan

Build a user management area gated to `department === 'top_management'`. Top mgmt can list, view, edit, suspend, reactivate, soft-delete, and reset passwords of employee accounts. Every meaningful user action gets recorded on the user's own document via an embedded, capped `activityLog`, so top mgmt has a per-user trail of what each person has been doing in the app.

## Key constraints (from the ask)

- Action logs are **stored on the user document**, not a separate collection. (Existing `AuditLog` model stays untouched — it's project-scoped and serves a different purpose.)
- Gate on `top_management` department, not on the legacy `admin` role. The current `/admin/users` route stays as-is; this is a new surface.
- Suspended or soft-deleted users cannot log in or use any authenticated endpoint.

## Decisions

- `User` schema: add `status: 'active' | 'suspended' | 'deleted'` (default `active`), plus `suspendedAt/By/Reason` and `deletedAt/By` metadata. Keep the existing `active: Boolean` in sync for back-compat.
- `User.activityLog`: embedded array, **capped at the last 200 entries** via `$push: { $each, $slice: -200 }`. Each entry: `{ action, at, target, targetType, metadata, ip }`.
- `logActivity(userId, action, extra)` lives in `server/src/services/userActivity.js`. Best-effort — failures log to console and don't break the request flow.
- `auth.js` middleware rejects requests where `status !== 'active'`. Login controller does the same check after credentials pass.
- Self-protection in admin endpoints: top mgmt cannot suspend, delete, or demote themselves (department change away from `top_management`, role change to non-admin).

## Activity log: what gets recorded

High-signal actions only — no noise from reads or trivial preference toggles.

| Action key                  | Where wired                                  |
|----------------------------|----------------------------------------------|
| `auth.login`                | `auth.controller.js` after JWT issue         |
| `auth.password_changed`     | `user.controller.js#changePassword`          |
| `po.create`                 | `po.controller.js#createPO`                  |
| `po.add_question`           | `po.controller.js#addQuestion`               |
| `po.post_reply`             | `po.controller.js#postThread`                |
| `po.mark_final`             | `po.controller.js#markFinalAnswer`           |
| `po.sales_review`           | `po.controller.js#salesReview`               |
| `po.client_decision`        | `po.controller.js#clientApproval`            |
| `po.delete`                 | `po.controller.js#deletePO`                  |
| `admin.update_user`         | new top-mgmt controller                      |
| `admin.suspend_user`        | new top-mgmt controller (target also logged) |
| `admin.reactivate_user`     | new top-mgmt controller (target also logged) |
| `admin.delete_user`         | new top-mgmt controller (target also logged) |
| `admin.reset_password`      | new top-mgmt controller (target also logged) |

For admin actions, the entry is written **both** on the actor's log and the target's, so the target's trail shows "you were suspended by X on Y" and the actor's trail shows what they did.

## Steps

- [x] 1. Plan doc (this file).
- [x] 2. Extended `User` schema with `status`, suspension/deletion metadata, capped `activityLog`.
- [x] 3. `services/userActivity.js` + auth middleware rejects suspended/deleted users.
- [x] 4. `controllers/userAdmin.controller.js` + routes at `/users/admin/*` gated on top_management.
- [x] 5. Logging wired into login, password change, PO create/question/reply/final/review/decision/delete, and every admin action.
- [x] 6. `api/userAdmin.api.js` + `hooks/useUserAdmin.js`.
- [x] 7. `pages/UserManagement.jsx` + `pages/UserDetail.jsx`; sidebar entry visible only to top mgmt.
- [x] 8. Locales (en + mk) + green production build.

## Out of scope (next round)

- Email invites (no SMTP wired in this repo).
- Bulk operations on multiple users at once.
- Filtering the activity log by action type from the UI (just paginate / show all 200).
- Recording department changes / manager changes as separate dedicated events beyond the generic `admin.update_user` entry.

## Review

**Shipped**

- `User` schema carries `status: 'active' | 'suspended' | 'deleted'`, suspension and deletion metadata, and an embedded `activityLog` array capped at the last 200 entries via `$slice: -200`.
- `auth` middleware + login both reject non-active users with a clear message.
- New top-mgmt-only endpoints under `/api/users/admin`:
  - `GET    /` — list (default excludes deleted; `?includeDeleted=1` to include)
  - `GET    /:id` — full record incl. activity log
  - `PATCH  /:id` — edit name / department / isManager / role / manager / language
  - `POST   /:id/suspend` — suspend with optional `reason`
  - `POST   /:id/reactivate` — reactivate (deleted users can't be revived this way)
  - `DELETE /:id` — soft delete
  - `POST   /:id/reset-password` — returns a one-time temp password to the caller
- Every admin action writes an entry to **both** the actor's and the target's `activityLog`, so each user's document shows what's been done to them and what they've done.
- Activity logging instrumented on: login, own password change, PO create/add_question/post_reply/mark_final/sales_review/client_decision/delete.
- Frontend: `/admin/user-management` list with search + status chips; `/admin/user-management/:id` detail with editable form, suspend/reactivate/reset-password/delete actions, and a right-rail activity timeline showing the latest 200 entries with optional metadata details.
- Self-protection: top mgmt cannot suspend, delete, or demote themselves out of top management.
- Sidebar gains a "User Management" entry under the Administration section, visible only to top management. Legacy `/admin/users` admin-role page is untouched.

**Verified**

- `node --check` clean on every modified/new server file.
- `vite build` succeeds (1.44 MB, 406 kB gzipped).
- Lint errors limited to one pre-existing pattern (`set-state-in-effect`) that the project already triggers elsewhere — build is green.

**Not in this slice**

- Email invites for newly created accounts (no SMTP in this repo).
- Bulk operations or activity-log filtering UI.
- Recording department / manager-change diffs as dedicated events beyond the generic `admin.update_user` metadata payload.
- Suspended-user notifications cleanup.
