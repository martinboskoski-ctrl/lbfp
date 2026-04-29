export const isTopManagement = (user) => user?.department === 'top_management';
export const canManage = (user) => user?.isManager === true || isTopManagement(user);

export const isHR = (user) => user?.department === 'hr';
export const isHRManager = (user) => isHR(user) && user?.isManager === true;

// True for HR managers + top management (full read/write across all employees)
export const isHRAdmin = (user) => isHRManager(user) || isTopManagement(user);

// Can the viewer see the HR file of `target`? Self, own-dept manager, HR, top mgmt.
export const canViewHRFile = (viewer, target) => {
  if (!viewer || !target) return false;
  if (String(viewer._id) === String(target._id || target.user?._id || target.user)) return true;
  if (isHRAdmin(viewer)) return true;
  const targetDept = target.department || target.user?.department;
  if (viewer.isManager && viewer.department === targetDept) return true;
  return false;
};

// Can edit the file (most fields). Salary uses canViewSalary instead.
export const canEditHRFile = (viewer) => isHRAdmin(viewer);

// Compensation visibility — by default HR + top mgmt + the employee themselves.
// Direct managers see it only when EmployeeProfile.salaryVisibleToManager === true.
export const canViewSalary = (viewer, target, profile) => {
  if (!viewer || !target) return false;
  if (String(viewer._id) === String(target._id || target.user?._id || target.user)) return true;
  if (isHRAdmin(viewer)) return true;
  if (
    profile?.salaryVisibleToManager &&
    viewer.isManager &&
    viewer.department === (target.department || target.user?.department)
  ) return true;
  return false;
};

// Confidential documents and HR private notes — HR + top mgmt only.
export const canViewConfidential = (viewer) => isHRAdmin(viewer);

// Self-only edits (phone, address, emergency contact, education, skills).
export const canSelfEdit = (viewer, target) =>
  String(viewer?._id) === String(target?._id || target?.user?._id || target?.user);
