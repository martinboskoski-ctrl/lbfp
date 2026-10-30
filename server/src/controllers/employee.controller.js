import User from '../models/User.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveEntry from '../models/LeaveEntry.js';
import DisciplinaryAction from '../models/DisciplinaryAction.js';
import { isHRAdmin, canManageEmployee, canViewEmployeeCards } from '../utils/hrAccess.js';
import { buildScopeFilter, decorateUserAlerts, buildEmployeeFile } from '../services/employeeFile.js';

export const listEmployees = async (req, res) => {
  if (!canViewEmployeeCards(req.user)) return res.status(403).json({ message: 'Forbidden' });
  const filter = buildScopeFilter(req.user);
  if (req.query.dept) filter.department = req.query.dept;
  const users = await User.find(filter).select('-passwordHash').sort('department name').lean();
  const decorated = await decorateUserAlerts(users);
  res.json({ employees: decorated });
};

export const getEmployeeFile = async (req, res) => {
  const result = await buildEmployeeFile(req.user, req.params.id);
  if (result.error === 404) return res.status(404).json({ message: 'Employee not found' });
  if (result.error === 403) return res.status(403).json({ message: 'Forbidden' });
  res.json(result);
};

// ── Annual leave and discipline (edited on the employee card) ────────────────

const httpError = (status, message) => Object.assign(new Error(message), { status });

const loadTarget = async (viewer, id, check) => {
  const target = await User.findById(id).select('department').lean();
  if (!target) throw httpError(404, 'Employee not found');
  if (!check(viewer, target)) throw httpError(403, 'Forbidden');
  return target;
};

// Every change answers with the refreshed card, like GET /employees/:id.
const respondWithFile = async (req, res, status = 200) => {
  const result = await buildEmployeeFile(req.user, req.params.id);
  res.status(status).json(result);
};

const parseDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const addLeaveEntry = async (req, res) => {
  const target = await loadTarget(req.user, req.params.id, canManageEmployee);
  const from = parseDate(req.body.from);
  const to = parseDate(req.body.to);
  const days = Number(req.body.days);
  if (!from || !to || to < from) throw httpError(400, 'Невалиден период');
  if (!(days > 0) || days > 366) throw httpError(400, 'Невалиден број на денови');
  await LeaveEntry.create({
    user: target._id, from, to, days, note: (req.body.note || '').trim(), createdBy: req.user._id,
  });
  await respondWithFile(req, res, 201);
};

export const deleteLeaveEntry = async (req, res) => {
  await loadTarget(req.user, req.params.id, canManageEmployee);
  const entry = await LeaveEntry.findOneAndDelete({ _id: req.params.entryId, user: req.params.id });
  if (!entry) throw httpError(404, 'Записот не е пронајден');
  await respondWithFile(req, res);
};

export const setLeaveEntitlement = async (req, res) => {
  const target = await loadTarget(req.user, req.params.id, (viewer) => isHRAdmin(viewer));
  const year = Number(req.params.year);
  const totalDays = Number(req.body.totalDays);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw httpError(400, 'Невалидна година');
  if (!(totalDays >= 0) || totalDays > 100) throw httpError(400, 'Невалиден број на денови');
  await LeaveBalance.updateOne(
    { user: target._id, year },
    { $set: { totalDays }, $setOnInsert: { usedDays: 0 } },
    { upsert: true },
  );
  await respondWithFile(req, res);
};

const DISCIPLINE_TYPES = ['verbal_warning', 'written_warning', 'reprimand', 'suspension', 'investigation', 'termination_notice'];

// A short record: date, type, reason. It is recorded as issued — no approval workflow.
export const addDiscipline = async (req, res) => {
  const target = await loadTarget(req.user, req.params.id, canManageEmployee);
  const reason = (req.body.reason || '').trim();
  const issuedDate = parseDate(req.body.issuedDate || Date.now());
  if (!DISCIPLINE_TYPES.includes(req.body.type)) throw httpError(400, 'Изберете вид');
  if (!reason) throw httpError(400, 'Внесете причина');
  if (!issuedDate) throw httpError(400, 'Невалиден датум');
  await DisciplinaryAction.create({
    user: target._id, type: req.body.type, reason, issuedDate,
    expiryDate: parseDate(req.body.expiryDate) || null,
    issuedBy: req.user._id, status: 'issued',
  });
  await respondWithFile(req, res, 201);
};

export const deleteDiscipline = async (req, res) => {
  await loadTarget(req.user, req.params.id, (viewer) => isHRAdmin(viewer));
  const action = await DisciplinaryAction.findOneAndDelete({ _id: req.params.actionId, user: req.params.id });
  if (!action) throw httpError(404, 'Записот не е пронајден');
  await respondWithFile(req, res);
};
