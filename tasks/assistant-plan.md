# AI асистент — working plan

> Living document for the company AI assistant on Почетна. Update **Progress** and
> **Open questions** as we go.

## 1. Purpose
Ask questions in plain language (MK or EN) and get answers from the company's own data
in the app — employees, tasks, projects, contracts, procedures, packaging checks, sales —
instead of clicking through pages. Starts small; every new feature / more data makes
it more useful.

## 2. Decisions (confirmed 2026-10-30)
| Topic | Decision |
|---|---|
| Who | **Top management only** (v1). Every tool still enforces the app's permission rules, so opening it to managers/employees later is a one-line change. |
| Sensitive HR data | **Same as the app** — salary, discipline, medical/sanitary via the existing `utils/hrAccess.js` rules (top mgmt sees all). |
| Placement | **Почетна only**, a bar above the task board. |
| Model | OpenAI Responses API, same key as the packaging check (`ASSISTANT_AI_*` overrides `PACKAGING_AI_*`). |

## 3. Principles
1. **Never more than the user can see.** The model has no DB access. It calls server
   *tools*; each tool runs **as the logged-in user** through the same permission checks as
   the pages. The model picks the tool; the server decides the data.
2. **Read-only** in v1.
3. **Grounded + linked.** Answer only from tool results; say so when data is missing.
   Cite records as links (`/employees/:id`, `/agreements/:id`, …).
4. **Logged.** Every question: user, question, tools used, answer, duration, tokens.
5. **Rate-limited** per user.

## 4. Tools (v1)
| Tool | Data | Scope |
|---|---|---|
| `company_overview` | headcount per dept, task status / overdue, active projects, expiring contracts, open packaging checks | per user |
| `search_employees` | name, dept, position, manager, contract end | `/employees` scope |
| `get_employee_file` | full HR file (profile, contract, salary*, discipline*, leave, assets, documents, incidents) | `canViewHRFile` + `projectHRFile` |
| `list_tasks` | filter by dept / assignee / status / overdue / due within N days | task-controller scope |
| `task_stats` | counts by department / assignee / status | task-controller scope |
| `list_projects` | projects with status, owner, deadline, task progress | project-controller scope |
| `list_agreements` | contracts by status / expiry / text | `canSeeAgreement` |
| `search_procedures` / `get_procedure` | procedure book (full text) | all users |
| `packaging_checks` | checks with status and pending remarks per sector | packaging tool scope |
| `sales_overview` | leads by status + value, clients and orders | sales + top mgmt |

## 5. Architecture
- `server/src/services/assistant/tools.js` — tool schemas + handlers `(user, args)`.
- `server/src/services/assistant/index.js` — tool-calling loop (max 6 steps).
- `server/src/controllers/assistant.controller.js`, `routes/assistant.routes.js` → `POST /api/assistant/chat`.
- `server/src/models/AssistantLog.js`.
- Employee HR file assembly moved to a shared service used by both `/api/employees/:id` and the tool.
- Client: `components/assistant/AssistantBar.jsx` on Dashboard (top mgmt), chat panel,
  suggested questions, link rendering, conversation kept in the page session.

## 6. Progress
- [x] Plan (this file)
- [x] Shared employee-file service (`services/employeeFile.js`) — old vs new endpoints compared on
      live data for 3 viewer types × 29 employees: 87 responses, 0 differences
- [x] 11 tools + loop (max 6 steps) + `POST /api/assistant/chat`, `GET /api/assistant/status`,
      `AssistantLog`, rate limit 40 questions / 10 min / user
- [x] Tests on a throwaway DB: 37/37 (scope of every tool per user type, loop with fake model,
      endpoint guards)
- [x] UI: assistant bar above the task board (top mgmt only), chat panel, suggested questions,
      safe markdown (in-app links only), conversation kept for the browser session
- [x] Real end-to-end on localhost: overview, expiring contracts, off-topic refusal — numbers
      verified against the DB; ~5 s and ~1–4k tokens per question
- [ ] Click-through in the browser
- [ ] Railway: same AI variables as the packaging check (or `ASSISTANT_AI_*`)

## 7. Later / ideas
- Open to managers (own department) and employees (own data).
- Actions with confirmation ("create a task for …").
- Weekly digest for top management.
- New tools as features/data grow (attendance, production, finance…).

## 8. Open questions
- Sign OpenAI's Data Processing Addendum before HR data goes through the API; inform employees.
