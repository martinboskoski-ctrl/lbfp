// HR access helpers — mirrored from client/src/utils/userTier.js so controllers
// can apply the same matrix.

export const isTopManagement = (u) => u?.department === 'top_management';
export const isHRAdmin = (u) =>
  isTopManagement(u) || (u?.department === 'hr' && u?.isManager === true);

// Can the viewer see the HR file of `target`?
// `target` should be a User-shaped object (department, _id).
export const canViewHRFile = (viewer, target) => {
  if (!viewer || !target) return false;
  if (String(viewer._id) === String(target._id)) return true;
  if (isHRAdmin(viewer)) return true;
  if (viewer.isManager && viewer.department === target.department) return true;
  return false;
};

export const canEditHRFile = (viewer) => isHRAdmin(viewer);

export const canViewSalary = (viewer, target, profile) => {
  if (!viewer || !target) return false;
  if (String(viewer._id) === String(target._id)) return true;
  if (isHRAdmin(viewer)) return true;
  if (profile?.salaryVisibleToManager && viewer.isManager && viewer.department === target.department) return true;
  return false;
};

export const canViewConfidential = (viewer) => isHRAdmin(viewer);

// Strip fields the viewer is not allowed to see.
// Mutates a plain object copy of the file payload.
export const projectHRFile = ({ viewer, targetUser, profile, payload }) => {
  const out = { ...payload };
  if (!canViewSalary(viewer, targetUser, profile)) {
    out.compensation = { hidden: true };
    out.salaryHistory = [];
  }
  if (!canViewConfidential(viewer)) {
    delete out.hrNotes;
    if (Array.isArray(out.documents)) {
      out.documents = out.documents.filter((d) => !d.confidential);
    }
    delete out.auditLog;
    delete out.family;
    delete out.beneficiaries;
  }
  return out;
};
