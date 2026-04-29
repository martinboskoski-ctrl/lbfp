import User from '../models/User.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import SalaryHistory from '../models/SalaryHistory.js';
import DisciplinaryAction from '../models/DisciplinaryAction.js';
import EmployeeAsset from '../models/EmployeeAsset.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import IncidentReport from '../models/IncidentReport.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Request from '../models/Request.js';
import {
  isHRAdmin,
  canViewHRFile,
  canViewSalary,
  canViewConfidential,
  projectHRFile,
} from '../utils/hrAccess.js';

// Build the list of users an authenticated viewer can see in /employees.
const buildScopeFilter = (viewer) => {
  if (isHRAdmin(viewer)) return {};
  if (viewer.isManager) return { department: viewer.department };
  // Regular employee — only themselves.
  return { _id: viewer._id };
};

const DAY_MS = 86_400_000;

const computeContractStatus = (p) => {
  if (!p) return 'unknown';
  if (p.contractType === 'open_ended' || !p.contractEnd) return 'open_ended';
  const days = Math.ceil((new Date(p.contractEnd) - new Date()) / DAY_MS);
  if (days < 0) return 'expired';
  if (days <= 60) return 'expiring_soon';
  return 'active';
};

const computeSanitaryStatus = (p) => {
  if (!p?.sanitaryCheckNext) return 'unknown';
  const days = Math.ceil((new Date(p.sanitaryCheckNext) - new Date()) / DAY_MS);
  if (days < 0) return 'overdue';
  if (days <= 30) return 'due_soon';
  return 'ok';
};

const computeSeniority = (p) => {
  const start = p?.hireDate || p?.contractStart;
  if (!start) return null;
  return Math.floor((Date.now() - new Date(start).getTime()) / (365.25 * DAY_MS));
};

// Decorate each user with quick-glance HR alerts for the list view.
const decorateUserAlerts = async (users) => {
  const userIds = users.map((u) => u._id);
  const profiles = await EmployeeProfile.find({ user: { $in: userIds } }).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  const year = new Date().getFullYear();
  const balances = await LeaveBalance.find({ user: { $in: userIds }, year }).lean();
  const balanceByUser = new Map(balances.map((b) => [String(b.user), b]));

  return users.map((u) => {
    const p = profileByUser.get(String(u._id));
    const b = balanceByUser.get(String(u._id));
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      department: u.department,
      isManager: u.isManager,
      role: u.role,
      active: u.active !== false,
      manager: u.manager,
      position: p?.position || null,
      contractStatus: computeContractStatus(p),
      contractEnd: p?.contractEnd || null,
      sanitaryCheckStatus: computeSanitaryStatus(p),
      seniorityYears: computeSeniority(p),
      leaveRemaining: b ? b.totalDays - b.usedDays : null,
      leaveTotal: b?.totalDays ?? null,
    };
  });
};

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
  const target = await User.findById(req.params.id).select('-passwordHash').lean();
  if (!target) return res.status(404).json({ message: 'Employee not found' });
  if (!canViewHRFile(req.user, target)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const targetId = target._id;

  const [profile, salary, discipline, assets, documents, incidents, balances, leaveRequests, manager] =
    await Promise.all([
      EmployeeProfile.findOne({ user: targetId }).lean(),
      SalaryHistory.find({ user: targetId }).sort({ effectiveDate: -1 }).lean(),
      DisciplinaryAction.find({ user: targetId }).sort({ issuedDate: -1 }).lean(),
      EmployeeAsset.find({ user: targetId }).sort({ issuedDate: -1 }).lean(),
      EmployeeDocument.find({ user: targetId }).sort({ createdAt: -1 }).lean(),
      IncidentReport.find({ user: targetId }).sort({ occurredAt: -1 }).lean(),
      LeaveBalance.find({ user: targetId }).sort({ year: -1 }).lean(),
      Request.find({ requester: targetId }).sort({ createdAt: -1 }).limit(50).lean(),
      target.manager ? User.findById(target.manager).select('name department').lean() : null,
    ]);

  // Enrich derived fields (mirrors the model virtuals — needed because we use lean())
  if (profile) {
    profile.contractStatus = computeContractStatus(profile);
    profile.contractDaysLeft = profile.contractEnd
      ? Math.ceil((new Date(profile.contractEnd) - new Date()) / DAY_MS)
      : null;
    profile.sanitaryCheckStatus = computeSanitaryStatus(profile);
    profile.seniorityYears = computeSeniority(profile);
  }
  for (const d of discipline) {
    d.isActive = !['draft', 'declined', 'overturned', 'expired'].includes(d.status)
      && (!d.expiryDate || new Date(d.expiryDate) > new Date());
  }
  for (const a of assets) {
    a.isReturned = !!a.returnedDate;
  }
  for (const doc of documents) {
    if (!doc.expiryDate) doc.expiryStatus = 'na';
    else {
      const days = Math.ceil((new Date(doc.expiryDate) - new Date()) / DAY_MS);
      doc.expiryStatus = days < 0 ? 'expired' : days <= 30 ? 'expiring_soon' : 'valid';
    }
  }
  for (const b of balances) {
    b.remainingDays = b.totalDays - b.usedDays;
  }

  const directReports = await User.find({ manager: targetId }).select('name department position').lean();

  const currentSalary = salary[0] || null;

  const payload = {
    user: target,
    manager,
    directReports,
    profile: profile || null,
    compensation: currentSalary
      ? {
          grossAmount: currentSalary.grossAmount,
          netAmount: currentSalary.netAmount,
          currency: currentSalary.currency,
          payFrequency: currentSalary.payFrequency,
          allowances: currentSalary.allowances,
          effectiveDate: currentSalary.effectiveDate,
        }
      : null,
    salaryHistory: salary,
    discipline,
    assets,
    documents,
    incidents,
    leaveBalances: balances,
    leaveRequests,
  };

  // Include hrNotes only for HR admins.
  if (canViewConfidential(req.user)) {
    payload.hrNotes = profile?.hrNotes || '';
  }

  // Permission-aware projection
  const projected = projectHRFile({
    viewer: req.user,
    targetUser: target,
    profile,
    payload,
  });

  res.json({
    file: projected,
    permissions: {
      canEdit: isHRAdmin(req.user),
      canViewSalary: canViewSalary(req.user, target, profile),
      canViewConfidential: canViewConfidential(req.user),
      isSelf: String(req.user._id) === String(target._id),
    },
  });
};
