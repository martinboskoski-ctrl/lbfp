import User from '../models/User.js';
import { REQUEST_TYPES } from '../config/requestTypes.js';
import { notify } from './notification.js';

const resolveDept = (dept, requesterDept) =>
  dept === '__requester_dept__' ? requesterDept : dept;

/**
 * Find all users who can approve the given step.
 */
export const resolveApprovers = async (stepDef, requesterDept) => {
  const dept = resolveDept(stepDef.department, requesterDept);

  if (stepDef.role === 'manager') {
    // Department manager(s) of the resolved department
    return User.find({ department: dept, isManager: true }).lean();
  }

  // 'department' role — any member of that department (managers or top management members)
  if (dept === 'top_management') {
    return User.find({ department: 'top_management' }).lean();
  }
  return User.find({
    $or: [
      { department: dept, isManager: true },
      { department: dept },
    ],
  }).lean();
};

/**
 * Check if a user can act on the current step.
 * Top management can always act on any step.
 */
export const canActOnStep = (user, stepDef, requesterDept) => {
  if (user.department === 'top_management') return true;

  const dept = resolveDept(stepDef.department, requesterDept);

  if (stepDef.role === 'manager') {
    return user.department === dept && user.isManager;
  }

  // 'department' role — user belongs to that department
  return user.department === dept;
};

/**
 * Get the step definition for a request's current step.
 */
export const getCurrentStepDef = (request) => {
  const config = REQUEST_TYPES[request.type];
  if (!config) return null;
  return config.steps[request.currentStep] || null;
};

/**
 * Notify all eligible approvers for the current step.
 */
export const notifyNextApprovers = async (request, stepDef) => {
  const approvers = await resolveApprovers(stepDef, request.department);
  // Also include all top management
  const topMgmt = await User.find({ department: 'top_management' }).lean();

  const allIds = new Set([
    ...approvers.map((u) => u._id.toString()),
    ...topMgmt.map((u) => u._id.toString()),
  ]);

  // Don't notify the requester
  allIds.delete(request.requester.toString());

  const promises = [...allIds].map((id) =>
    notify({
      recipientId: id,
      type: 'request_pending',
      title: `Ново барање: ${REQUEST_TYPES[request.type].label}`,
      message: `Барање #${request._id.toString().slice(-6)} чека одобрување`,
      link: `/requests/${request._id}`,
    })
  );

  await Promise.all(promises);
};
