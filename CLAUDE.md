# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


# Workflow Orchestration

## 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don’t keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

## 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: “Would a staff engineer approve this?”
- Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask “is there a more elegant way?”
- If a fix feels hacky: “Knowing everything I know now, implement the elegant solution”
- Skip this for simple, obvious fixes – don’t over-engineer
- Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don’t ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

-----

# Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
1. **Verify Plan**: Check in before starting implementation
1. **Track Progress**: Mark items complete as you go
1. **Explain Changes**: High-level summary at each step
1. **Document Results**: Add review section to `tasks/todo.md`
1. **Capture Lessons**: Update `tasks/lessons.md` after corrections

-----

# Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what’s necessary. Avoid introducing bugs.

## Commands

```bash
# Start both client and server concurrently from root
npm run dev

# Start individually (preferred — macOS port 5000 conflicts with AirPlay)
npm run dev --prefix server   # Express on :5001
npm run dev --prefix client   # Vite on :5173

# Install all dependencies
npm run install:all

# Lint client
npm run lint --prefix client

# Production build
npm run build --prefix client
npm run start --prefix server

# Docker (includes MongoDB)
docker compose up -d
```

Server requires `server/.env` with at minimum `MONGO_URI` and `JWT_SECRET`.

## Architecture

**Monorepo** with npm workspaces: `client/` (React) and `server/` (Express). Both use `"type": "module"` (ESM).

### Server (`server/src/`)

Straightforward MVC — `routes/` → `controllers/` → `models/`. No service layer except `services/` for S3.

- `app.js` — Express entry; mounts all routes under `/api/*`
- `middleware/auth.js` — JWT verification, attaches `req.user`
- `middleware/role.js` — `requireRole(...roles)` guard for route-level RBAC
- `models/User.js` — `department`, `isManager`, `role` fields; `toSafeObject()` strips `passwordHash`
- `models/Task.js` — standalone Kanban task (separate from `Project`'s embedded tasks)
- `models/Project.js` — general PM model with embedded tasks, subtasks, involvedDepartments
- `models/PurchaseOrder.js` — cross-dept Q&A workflow; questions target specific departments

**Access control is enforced in controllers**, not just middleware. The task controller is the canonical example: top management sees all, managers see their dept, employees see only their own tasks.

### Client (`client/src/`)

- `App.jsx` — all routes; `ProtectedRoute` wraps authenticated routes with optional `allowedRoles`
- `context/AuthContext.jsx` — JWT stored in `localStorage` as `packflow_token`; `useAuth()` provides `user`, `login`, `logout`
- `api/axios.js` — single Axios instance with auth header injection and 401→redirect interceptor (excludes `/auth/*` endpoints)
- `utils/userTier.js` — `isTopManagement(user)`, `canManage(user)` — use these everywhere for permission checks
- `components/layout/Sidebar.jsx` — exports `DEPARTMENTS` array (used throughout the app for dept labels/icons)

**Data fetching pattern:** every feature has a hook file in `hooks/` (e.g. `useTasks.js`) that wraps TanStack Query. All task mutations call `invalidateQueries({ queryKey: ['tasks'] })` on the parent key to flush all dept-filtered variants. Replicate this pattern for new features.

### Three-Tier Access Model

| Tier | Condition | Scope |
|------|-----------|-------|
| Employee | `isManager=false`, dept ≠ `top_management` | Own tasks only |
| Manager | `isManager=true` | Own department |
| Top Management | `department='top_management'` | All departments |

Check with `canManage(user)` (manager OR top mgmt) and `isTopManagement(user)` on the client. Mirror the same logic in controllers server-side.

### Dashboard Navigation

URL pattern: `/dashboard?dept=sales&tab=tasks`

Tabs per department: `terkovi | projects | tasks | nabavki | vraboteni` — plus `po` for `PO_DEPTS = ['sales', 'quality_assurance', 'r_and_d', 'nabavki']`.

### Global CSS Utilities

Defined in `client/src/index.css` as Tailwind component layers — use these instead of repeating classes:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.input` — standard form input
- `.label` — form field label
- `.card` — white rounded bordered card

### File Uploads

S3 flow: client calls `POST /api/files/initiate` → gets presigned URL → uploads directly to S3 → calls `POST /api/files/confirm` with file size. See `hooks/useProjects.js` for usage (`useInitiateUpload`, `useConfirmUpload`, `useDownloadUrl`).
