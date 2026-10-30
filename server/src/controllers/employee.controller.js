import User from '../models/User.js';
import { isHRAdmin } from '../utils/hrAccess.js';
import { buildScopeFilter, decorateUserAlerts, buildEmployeeFile } from '../services/employeeFile.js';

export const listEmployees = async (req, res) => {
  const filter = buildScopeFilter(req.user);
  const dept = req.query.dept;
  if (dept) {
    if (!isHRAdmin(req.user) && req.user.department !== dept) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    filter.department = dept;
  }
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
