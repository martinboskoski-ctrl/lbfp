import User from '../models/User.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import SalaryHistory from '../models/SalaryHistory.js';
import DisciplinaryAction from '../models/DisciplinaryAction.js';
import EmployeeAsset from '../models/EmployeeAsset.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import IncidentReport from '../models/IncidentReport.js';
import LeaveBalance from '../models/LeaveBalance.js';
import {
  isHRAdmin,
  canViewHRFile,
  canViewSalary,
  canViewConfidential,
  projectHRFile,
} from '../utils/hrAccess.js';

// Employee directory + HR file assembly, shared by the employees API and the AI assistant
// so both apply exactly the same scope and field projection.

// Build the list of users an authenticated viewer can see in /employees.
export const buildScopeFilter = (viewer) => {
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
export const decorateUserAlerts = async (users) => {
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

/**
 * The HR file of `targetId` as `viewer` may see it — the same projection the
 * employee page shows. Returns { error: 404|403 } or { file, permissions }.
 */
export const buildEmployeeFile = async (viewer, targetId) => {
  const target = await User.findById(targetId).select('-passwordHash').lean();
  if (!target) return { error: 404 };
  if (!canViewHRFile(viewer, target)) return { error: 403 };


  const [profile, salary, discipline, assets, documents, incidents, balances, manager] =
    await Promise.all([
      EmployeeProfile.findOne({ user: target._id }).lean(),
      SalaryHistory.find({ user: target._id }).sort({ effectiveDate: -1 }).lean(),
      DisciplinaryAction.find({ user: target._id }).sort({ issuedDate: -1 }).lean(),
      EmployeeAsset.find({ user: target._id }).sort({ issuedDate: -1 }).lean(),
      EmployeeDocument.find({ user: target._id }).sort({ createdAt: -1 }).lean(),
      IncidentReport.find({ user: target._id }).sort({ occurredAt: -1 }).lean(),
      LeaveBalance.find({ user: target._id }).sort({ year: -1 }).lean(),
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

  const directReports = await User.find({ manager: target._id }).select('name department position').lean();

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
  };

  // Include hrNotes only for HR admins.
  if (canViewConfidential(viewer)) {
    payload.hrNotes = profile?.hrNotes || '';
  }

  // Permission-aware projection
  const projected = projectHRFile({
    viewer: viewer,
    targetUser: target,
    profile,
    payload,
  });

  return {
    file: projected,
    permissions: {
      canEdit: isHRAdmin(viewer),
      canViewSalary: canViewSalary(viewer, target, profile),
      canViewConfidential: canViewConfidential(viewer),
      isSelf: String(viewer._id) === String(target._id),
    },
  };
};
