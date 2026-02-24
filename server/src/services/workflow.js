import File from '../models/File.js';

/**
 * Validate that a project has all mandatory fields for Gate 0 submission.
 */
export const validateGate0Fields = (project) => {
  const required = ['clientName', 'skuName', 'packagingFormat', 'ingredientList'];
  const missing = required.filter((field) => !project[field]);
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
};

/**
 * Check if the previous gate is approved (required before advancing).
 */
export const isPreviousGateApproved = (project, targetGate) => {
  if (targetGate === 0) return true;
  const prevGate = project.gates[targetGate - 1];
  return prevGate && prevGate.status === 'approved';
};

/**
 * Advance project to the next gate.
 * Returns true if advanced, false if blocked.
 */
export const advanceGate = async (project, fromGate) => {
  const nextGate = fromGate + 1;
  if (nextGate > 4) return false;

  // Gate 3 → 4 requires at least one file uploaded
  if (fromGate === 3) {
    const fileCount = await File.countDocuments({ project: project._id });
    if (fileCount === 0) return false;
  }

  project.gates[fromGate].status = 'approved';
  project.currentGate = nextGate;
  project.gates[nextGate].status = 'in_progress';
  project.status = 'active';

  return true;
};

/**
 * Reject a gate — project stays at that gate, status set to rejected.
 */
export const rejectGate = (project, gateNumber, reason) => {
  project.gates[gateNumber].status = 'rejected';
  project.status = 'change_request';
  project.gates[gateNumber].rejectionReason = reason;
};
