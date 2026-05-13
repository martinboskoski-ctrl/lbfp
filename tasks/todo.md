# Employee detail page — task & workflow oversight

Turn the existing employee page into a workflow entry point for one person. Show what they're doing, what's overdue, how they're trending, and let the right people add work directly from there.

## Decisions

- **Analytics depth (stage 1):** Practical KPIs only — no charts/trends yet. KPI tiles + status mix bar + three lists (upcoming deadlines, active, recently completed).
- **Who sees the tab:** Top management + same-department manager + the employee themselves. Mirrors the existing HR file rule.
- **Add task UX:** Inline modal on the tab, pre-locked to this employee (no assignee/dept selection).

## Data — what the tab shows

Computed client-side from a single `/api/tasks?assignedTo=:userId` fetch (extends the existing endpoint with a new filter). Numbers are small enough per user that this is fine.

**KPI tiles (5):**
- Open — `status in (todo, in_progress)`
- Done last 30d — `status in (done, approved)` AND `updatedAt >= today - 30d`
- Overdue — `deadline < today` AND `status in (todo, in_progress)`
- On-time rate (last 30d completed) — % of recently completed where `completedAt <= deadline` (or 100% if no deadline was set)
- Avg cycle time (last 30d completed) — average `completedAt - createdAt` in days

**Sections:**
- Status mix — single horizontal stacked bar with todo / in_progress / done / approved.
- Upcoming deadlines — next 14 days, sorted ascending, color-coded (overdue red, today amber, this week neutral).
- Active — todo + in_progress, sorted by priority then deadline.
- Recently completed — last 10 done/approved.

**"+ Add task" button** at the top — opens a modal with assignee + department locked; user fills title/desc/priority/deadline/project. Hits existing `POST /api/tasks`.

## Steps

- [x] 1. Plan (this file).
- [x] 2. Server: extended `task.controller.js#listTasks` with `?assignedTo=` scoped per role.
- [x] 3. Client: `useEmployeeTasks` hook added.
- [x] 4. Client: `EmployeeTasksTab` with KPIs, status mix, deadlines, active, completed.
- [x] 5. Client: `AddEmployeeTaskModal` with assignee + dept locked.
- [x] 6. Client: "Задачи" tab inserted into EmployeeDetail, gated to top-mgmt + same-dept manager + self.
- [x] 7. Locales added (en + mk), build green.

## Out of scope

- Trend charts (weekly throughput, overdue trend) — needs a charting dep, can come next.
- Per-project drill-down — current model is light, not enough signal yet.
- Editing/deleting tasks inline from this tab — links navigate to the Kanban context for now.

## Review

Shipped Stage-1 of the employee workflow oversight page.

**Server**
- `listTasks` accepts `?assignedTo=<userId>`. Top mgmt: any user. Manager: same-dept users only (filtered post-populate). Plain employee: forced to own id regardless of query.

**Client**
- New "Задачи" tab on `/employees/:id`, gated to top management, same-dept manager, or the employee themselves.
- KPI strip (5 tiles): Open, Done last 30d, Overdue, On-time %, Avg cycle days.
- Status mix bar — single horizontal stack of todo / in_progress / done / approved with legend + counts.
- Upcoming deadlines — next 14 days, soonest first, overdue red / today amber.
- Active tasks — sorted by priority then deadline.
- Recently completed — last 10, with a link to the full Kanban for the dept.
- "+ Add task" button (top mgmt and managers only) — opens a focused modal with assignee + department locked; reuses `useCreateTask`.

**Permissions confirmed**
- Self can see their tab but cannot add tasks for themselves from there (button hidden). That matches the rule we just shipped for inquiries: oversight surface, not self-edit.

**Verified**
- `node --check` clean on the task controller.
- `vite build` succeeds.
- Lint: two warnings on the new file matching pre-existing codebase patterns; not blocking.
