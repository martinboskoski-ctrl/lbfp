# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
