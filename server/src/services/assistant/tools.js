// Tools the AI assistant can call. Each handler runs AS THE LOGGED-IN USER and applies
// the same scope as the corresponding page/API, so the assistant never sees more than
// the user could see in the app. Results are compact JSON with links for citing.
import User, { DEPARTMENTS } from '../../models/User.js';
import Task from '../../models/Task.js';
import Project from '../../models/Project.js';
import Agreement from '../../models/Agreement.js';
import Procedure from '../../models/Procedure.js';
import PackagingCheck, { PACKAGING_SECTORS } from '../../models/PackagingCheck.js';
import Lead from '../../models/Lead.js';
import Client from '../../models/Client.js';
import { buildScopeFilter, decorateUserAlerts, buildEmployeeFile } from '../employeeFile.js';
import { canViewEmployeeCards } from '../../utils/hrAccess.js';
import { canSeeAgreement } from '../../controllers/agreement.controller.js';

const isTopMgmt = (u) => u.department === 'top_management';
const DAY_MS = 86_400_000;
const LIMIT = 50;

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRe = (s) => new RegExp(escapeRe(s.trim()), 'i');
const truncated = (all) => (all.length > LIMIT ? { items: all.slice(0, LIMIT), truncated: true, total: all.length } : { items: all, total: all.length });
const denied = (what) => ({ error: `not_permitted: this user cannot see ${what}` });

// Same scope as GET /api/tasks: top management any department, others their own.
const taskScope = (user, department) => (isTopMgmt(user)
  ? (department ? { department } : {})
  : { department: user.department });

// Same scope as GET /api/projects.
const projectScope = (user) => (isTopMgmt(user) ? {} : {
  $or: [{ department: user.department }, { 'involvedDepartments.department': user.department }],
});

const canUsePackaging = (u) => isTopMgmt(u) || PACKAGING_SECTORS.includes(u.department);
const canSeeSales = (u) => isTopMgmt(u) || u.department === 'sales';

// Users in the viewer's employee scope whose name matches.
const findPeople = async (user, name) =>
  User.find({ ...buildScopeFilter(user), name: nameRe(name) }).select('name department isManager').lean();

const taskRow = (t) => ({
  title: t.title,
  status: t.status,
  priority: t.priority,
  deadline: day(t.deadline),
  overdue: !!(t.deadline && new Date(t.deadline) < new Date() && !['done', 'approved'].includes(t.status)),
  assignee: t.assignedTo?.name || null,
  department: t.department,
  timeSpentMinutes: t.timeSpentMinutes ?? null,
});

// Strip bulky / internal fields from an HR file before it goes to the model.
const compactFile = (file) => {
  const omit = new Set(['passwordHash', 'activityLog', 'editHistory', 'fileKey', 'annexFileKey', 'photoUrl', '__v', 'createdBy', 'updatedAt']);
  const clean = (v) => {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      return Object.fromEntries(Object.entries(v).filter(([k]) => !omit.has(k)).map(([k, x]) => [k, clean(x)]));
    }
    return v;
  };
  return clean(file);
};

const nullable = (type) => ({ type: [type, 'null'] });
const deptParam = { type: ['string', 'null'], enum: [...DEPARTMENTS, null], description: 'Department code, or null for all' };

export const TOOLS = [
  {
    name: 'company_overview',
    description: 'Headline numbers for the company (or what the user can see): headcount per department, tasks by status and overdue, active projects, contracts expiring in 60 days, open packaging checks.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
    handler: async (user) => {
      // Headcount comes from the employee directory: top management + HR only.
      const seesEmployees = canViewEmployeeCards(user);
      const users = seesEmployees
        ? await User.find({ active: { $ne: false } }).select('department').lean()
        : [];
      const headcount = {};
      for (const u of users) headcount[u.department] = (headcount[u.department] || 0) + 1;

      const tasks = await Task.find(taskScope(user)).select('status deadline').lean();
      const taskStatus = {};
      let overdue = 0;
      for (const t of tasks) {
        taskStatus[t.status] = (taskStatus[t.status] || 0) + 1;
        if (t.deadline && new Date(t.deadline) < new Date() && !['done', 'approved'].includes(t.status)) overdue++;
      }

      const projects = await Project.countDocuments({ ...projectScope(user), status: { $nin: ['completed', 'cancelled'] } });

      const agreements = (await Agreement.find(isTopMgmt(user) ? {} : { department: user.department }))
        .filter((a) => canSeeAgreement(a, user)).map((a) => a.toJSON());
      const expiringSoon = agreements.filter((a) => a.daysUntilExpiry != null && a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= 60).length;

      const packaging = canUsePackaging(user) ? await PackagingCheck.countDocuments({ status: 'in_review' }) : null;

      return {
        today: day(new Date()),
        headcount: seesEmployees ? headcount : null,
        employeesTotal: seesEmployees ? users.length : null,
        tasks: { byStatus: taskStatus, overdue, total: tasks.length },
        activeProjects: projects,
        contracts: { total: agreements.length, expiringWithin60Days: expiringSoon },
        packagingChecksInReview: packaging,
      };
    },
  },
  {
    name: 'search_employees',
    description: 'Find employees by name and/or department (top management and HR only). Returns position, department, manager flag, contract status/end, seniority, leave days remaining today (incl. last year\'s days until 30 June). Use get_employee_file for full details of one person.',
    parameters: {
      type: 'object',
      properties: { name: { ...nullable('string'), description: 'Part of the name, or null' }, department: deptParam },
      required: ['name', 'department'],
      additionalProperties: false,
    },
    handler: async (user, { name, department }) => {
      if (!canViewEmployeeCards(user)) return denied('employee records');
      const filter = buildScopeFilter(user);
      if (department) filter.department = department;
      if (name) filter.name = nameRe(name);
      const users = await User.find(filter).select('-passwordHash').sort('department name').lean();
      const rows = (await decorateUserAlerts(users)).map((u) => ({
        name: u.name, department: u.department, position: u.position, isManager: u.isManager, active: u.active,
        contractStatus: u.contractStatus, contractEnd: day(u.contractEnd), seniorityYears: u.seniorityYears,
        leaveRemaining: u.leaveRemaining, link: `/employees/${u._id}`,
      }));
      return truncated(rows);
    },
  },
  {
    name: 'get_employee_file',
    description: "Full HR file of one employee (top management and HR only): profile, contract, manager and direct reports, salary (only if the user may see it), disciplinary actions, assets, documents, incidents, and annual leave. In `leave`, each year's days are usable until 30 June of the next year; `years` has per year total, usedInYear, usedNextYear (Jan–Jun of the next year), remaining, validUntil; `entries` lists each leave taken with the year(s) it counted against.",
    parameters: {
      type: 'object',
      properties: { name: { type: 'string', description: "The employee's name (or part of it)" } },
      required: ['name'],
      additionalProperties: false,
    },
    handler: async (user, { name }) => {
      if (!canViewEmployeeCards(user)) return denied('employee records');
      const people = await findPeople(user, name);
      if (!people.length) return { error: 'no employee with that name is visible to this user' };
      if (people.length > 1) {
        return { ambiguous: true, candidates: people.map((p) => ({ name: p.name, department: p.department, link: `/employees/${p._id}` })) };
      }
      const result = await buildEmployeeFile(user, people[0]._id);
      if (result.error) return denied("this employee's file");
      return { link: `/employees/${people[0]._id}`, permissions: result.permissions, file: compactFile(result.file) };
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks with filters. Status values: todo, in_progress, done, approved.',
    parameters: {
      type: 'object',
      properties: {
        department: deptParam,
        assigneeName: { ...nullable('string'), description: 'Part of the assignee name, or null' },
        status: { type: ['string', 'null'], enum: ['todo', 'in_progress', 'done', 'approved', null] },
        overdueOnly: { type: 'boolean' },
        dueWithinDays: { ...nullable('integer'), description: 'Only tasks due in the next N days, or null' },
      },
      required: ['department', 'assigneeName', 'status', 'overdueOnly', 'dueWithinDays'],
      additionalProperties: false,
    },
    handler: async (user, { department, assigneeName, status, overdueOnly, dueWithinDays }) => {
      const q = taskScope(user, department);
      if (status) q.status = status;
      if (assigneeName) q.assignedTo = { $in: (await User.find({ name: nameRe(assigneeName) }).select('_id').lean()).map((u) => u._id) };
      if (overdueOnly) { q.deadline = { $lt: new Date() }; q.status = q.status || { $in: ['todo', 'in_progress'] }; }
      if (dueWithinDays != null) q.deadline = { ...(q.deadline || {}), $gte: new Date(), $lte: new Date(Date.now() + dueWithinDays * DAY_MS) };
      const tasks = await Task.find(q).populate('assignedTo', 'name').sort({ deadline: 1 }).lean();
      return truncated(tasks.map(taskRow));
    },
  },
  {
    name: 'task_stats',
    description: 'Count tasks grouped by department, assignee or status (open = todo + in_progress), with overdue counts.',
    parameters: {
      type: 'object',
      properties: { groupBy: { type: 'string', enum: ['department', 'assignee', 'status'] }, department: deptParam },
      required: ['groupBy', 'department'],
      additionalProperties: false,
    },
    handler: async (user, { groupBy, department }) => {
      const tasks = await Task.find(taskScope(user, department)).populate('assignedTo', 'name').lean();
      const groups = {};
      for (const t of tasks) {
        const key = groupBy === 'assignee' ? (t.assignedTo?.name || 'unassigned') : t[groupBy];
        const g = (groups[key] ||= { total: 0, open: 0, overdue: 0 });
        g.total++;
        if (['todo', 'in_progress'].includes(t.status)) g.open++;
        if (taskRow(t).overdue) g.overdue++;
      }
      return { groupBy, groups, total: tasks.length };
    },
  },
  {
    name: 'list_projects',
    description: 'Projects with status, owner, department, dates, budget and task progress.',
    parameters: {
      type: 'object',
      properties: { department: deptParam, status: { type: ['string', 'null'], enum: ['draft', 'active', 'on_hold', 'completed', 'cancelled', null] } },
      required: ['department', 'status'],
      additionalProperties: false,
    },
    handler: async (user, { department, status }) => {
      const q = { ...projectScope(user) };
      if (department) q.department = department;
      if (status) q.status = status;
      const projects = await Project.find(q).populate('owner', 'name').sort({ updatedAt: -1 }).lean();
      return truncated(projects.map((p) => ({
        title: p.title, status: p.status, priority: p.priority, department: p.department, owner: p.owner?.name,
        startDate: day(p.startDate), endDate: day(p.endDate), budget: p.budget,
        tasks: { total: p.tasks?.length || 0, done: (p.tasks || []).filter((t) => t.status === 'done').length },
        involvedDepartments: (p.involvedDepartments || []).map((d) => d.department),
        link: `/projects/${p._id}`,
      })));
    },
  },
  {
    name: 'list_agreements',
    description: 'Contracts / agreements register: party, category, status, dates, value, days until expiry. Can filter by text, status or expiry window.',
    parameters: {
      type: 'object',
      properties: {
        text: { ...nullable('string'), description: 'Search in title, other party, contract number, or null' },
        status: { type: ['string', 'null'], enum: ['draft', 'active', 'negotiating', 'for_renewal', 'renewing', 'expired', 'terminated', 'renewed', 'archived', 'expiring_soon', null] },
        expiringWithinDays: { ...nullable('integer'), description: 'Only contracts ending in the next N days, or null' },
        department: deptParam,
      },
      required: ['text', 'status', 'expiringWithinDays', 'department'],
      additionalProperties: false,
    },
    handler: async (user, { text, status, expiringWithinDays, department }) => {
      const q = isTopMgmt(user) ? (department ? { department } : {}) : { department: user.department };
      if (text) q.$or = [{ title: nameRe(text) }, { otherParty: nameRe(text) }, { contractNumber: nameRe(text) }];
      let rows = (await Agreement.find(q).populate('owner', 'name').sort({ endDate: 1 }))
        .filter((a) => canSeeAgreement(a, user))
        .map((a) => a.toJSON());
      if (status) rows = rows.filter((a) => a.effectiveStatus === status);
      if (expiringWithinDays != null) rows = rows.filter((a) => a.daysUntilExpiry != null && a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= expiringWithinDays);
      return truncated(rows.map((a) => ({
        title: a.title, contractNumber: a.contractNumber, otherParty: a.otherParty, category: a.category,
        department: a.department, status: a.effectiveStatus, startDate: day(a.startDate), endDate: day(a.endDate),
        daysUntilExpiry: a.daysUntilExpiry, value: a.value, currency: a.currency, owner: a.owner?.name,
        autoRenew: a.autoRenew, link: `/agreements/${a._id}`,
      })));
    },
  },
  {
    name: 'search_procedures',
    description: "Search the company procedure book (rulebooks and procedures) by words in the title or text. Returns titles with a short excerpt; then use get_procedure to read one.",
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Words to search for (in Macedonian or English)' } },
      required: ['query'],
      additionalProperties: false,
    },
    handler: async (_user, { query }) => {
      const words = query.split(/\s+/).filter((w) => w.length > 2).map(escapeRe);
      const all = await Procedure.find().select('title content departments').lean();
      const scored = all
        .map((p) => {
          const hay = `${p.title}\n${p.content}`.toLowerCase();
          const score = words.reduce((s, w) => s + (hay.match(new RegExp(w.toLowerCase(), 'g'))?.length || 0) + (p.title.toLowerCase().includes(w.toLowerCase()) ? 5 : 0), 0);
          return { p, score };
        })
        .filter((x) => x.score > 0 || !words.length)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      return {
        items: scored.map(({ p }) => {
          const i = words.length ? p.content.toLowerCase().search(new RegExp(words[0].toLowerCase())) : 0;
          return {
            title: p.title, scope: p.departments?.length ? p.departments : 'general',
            excerpt: p.content.slice(Math.max(0, i - 150), Math.max(0, i - 150) + 400),
            link: `/procedures/${p._id}`,
          };
        }),
      };
    },
  },
  {
    name: 'get_procedure',
    description: 'Read the full text of one procedure by (part of) its title.',
    parameters: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
      additionalProperties: false,
    },
    handler: async (_user, { title }) => {
      const p = await Procedure.findOne({ title: nameRe(title) }).lean();
      if (!p) return { error: 'no procedure with that title' };
      return { title: p.title, scope: p.departments?.length ? p.departments : 'general', content: p.content.slice(0, 15000), link: `/procedures/${p._id}` };
    },
  },
  {
    name: 'packaging_checks',
    description: "Packaging artwork checks: client, product, status (in_review, approved, changes_required), current round, the client email's department paragraphs still waiting for approval per sector, and whether the email was sent.",
    parameters: {
      type: 'object',
      properties: {
        status: { type: ['string', 'null'], enum: ['in_review', 'approved', 'changes_required', null] },
        waitingOnSector: { type: ['string', 'null'], enum: [...PACKAGING_SECTORS, null] },
      },
      required: ['status', 'waitingOnSector'],
      additionalProperties: false,
    },
    handler: async (user, { status, waitingOnSector }) => {
      if (!canUsePackaging(user)) return denied('packaging checks');
      const checks = await PackagingCheck.find(status ? { status } : {}).sort({ updatedAt: -1 }).lean();
      let rows = checks.map((c) => {
        const round = c.rounds.at(-1) || {};
        const sections = round.email?.sections || [];
        const emailSent = !!round.email?.sent?.at;
        // Paragraphs not yet approved by their owning sector.
        const pending = {};
        if (!emailSent) {
          for (const sec of sections) if (!sec.approval?.at) pending[sec.sector] = (pending[sec.sector] || 0) + 1;
        }
        return {
          code: c.code, client: c.client, product: c.product, markets: c.markets, status: c.status,
          round: round.number ?? null,
          remarks: sections.reduce((n, sec) => n + (sec.items?.length || 0), 0),
          paragraphsAwaitingApprovalBySector: pending, emailSent,
          updated: day(c.updatedAt), link: `/tools/packaging/${c._id}`,
        };
      });
      if (waitingOnSector) {
        rows = rows.filter((r) => r.status === 'in_review' && r.paragraphsAwaitingApprovalBySector[waitingOnSector]);
      }
      return truncated(rows);
    },
  },
  {
    name: 'sales_overview',
    description: 'Sales pipeline: leads by stage with estimated value and overdue follow-ups, plus clients with forecast / delivered order totals.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
    handler: async (user) => {
      if (!canSeeSales(user)) return denied('sales data');
      const leads = await Lead.find().populate('assignedTo', 'name');
      const byStage = {};
      for (const l of leads) {
        const s = (byStage[l.stage] ||= { count: 0, estimatedValueEUR: 0 });
        s.count++;
        if (l.currency === 'EUR') s.estimatedValueEUR += l.estimatedValue || 0;
      }
      const clients = await Client.find().populate('assignedTo', 'name');
      return {
        leads: {
          byStage,
          overdueFollowUps: leads.filter((l) => l.isOverdue).map((l) => ({ company: l.companyName, nextFollowUp: day(l.nextFollowUp), owner: l.assignedTo?.name })),
        },
        clients: clients.map((c) => ({
          company: c.companyName, status: c.status, owner: c.assignedTo?.name,
          forecastEUR: c.forecastTotal, deliveredEUR: c.deliveredTotal, openOrders: c.openOrderCount,
        })),
      };
    },
  },
];

// OpenAI function-tool definitions (strict schemas).
export const toolDefinitions = TOOLS.map(({ name, description, parameters }) => ({
  type: 'function', name, description, parameters, strict: true,
}));

export const runTool = async (user, name, args) => {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { error: `unknown tool ${name}` };
  try {
    return await tool.handler(user, args || {});
  } catch (err) {
    console.error(`Assistant tool ${name} failed:`, err);
    return { error: 'tool_failed' };
  }
};
