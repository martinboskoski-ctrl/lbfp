import Request from '../models/Request.js';
import { REQUEST_TYPES } from '../config/requestTypes.js';
import { validateRequestData } from '../services/requestValidation.js';
import { canActOnStep, getCurrentStepDef, notifyNextApprovers } from '../services/approvalEngine.js';
import { notify } from '../services/notification.js';
import LeaveBalance from '../models/LeaveBalance.js';
import { countBusinessDays } from '../utils/businessDays.js';

const isTopMgmt = (u) => u.department === 'top_management';

// POST /api/requests — create a new request
export const create = async (req, res) => {
  const { type, data } = req.body;

  const config = REQUEST_TYPES[type];
  if (!config) return res.status(400).json({ message: `Invalid request type: ${type}` });

  const error = validateRequestData(type, data || {});
  if (error) return res.status(400).json({ message: error });

  const request = await Request.create({
    type,
    requester: req.user._id,
    department: req.user.department,
    totalSteps: config.steps.length,
    data: data || {},
  });

  // Notify first-step approvers
  const firstStep = config.steps[0];
  await notifyNextApprovers(request, firstStep);

  await request.populate('requester', 'name department');
  res.status(201).json({ request });
};

// GET /api/requests/mine — requester's own requests
export const mine = async (req, res) => {
  const requests = await Request.find({ requester: req.user._id })
    .populate('requester', 'name department')
    .populate('stepHistory.actionBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ requests });
};

// GET /api/requests/pending — requests awaiting current user's approval
export const pending = async (req, res) => {
  // Get all non-finalized requests
  const candidates = await Request.find({ status: { $in: ['pending', 'in_progress'] } })
    .populate('requester', 'name department')
    .populate('stepHistory.actionBy', 'name')
    .sort({ createdAt: -1 });

  // Filter to ones where current user can act on the current step
  const filtered = candidates.filter((r) => {
    const stepDef = getCurrentStepDef(r);
    if (!stepDef) return false;
    return canActOnStep(req.user, stepDef, r.department);
  });

  res.json({ requests: filtered });
};

// GET /api/requests/:id — single request detail
export const getOne = async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('requester', 'name department')
    .populate('stepHistory.actionBy', 'name');

  if (!request) return res.status(404).json({ message: 'Request not found' });

  // Access: requester, top management, or someone who can act on any step
  const isRequester = request.requester._id.toString() === req.user._id.toString();
  if (!isRequester && !isTopMgmt(req.user)) {
    const stepDef = getCurrentStepDef(request);
    if (!stepDef || !canActOnStep(req.user, stepDef, request.department)) {
      // Check if user acted on a previous step
      const acted = request.stepHistory.some(
        (s) => s.actionBy._id?.toString() === req.user._id.toString()
      );
      if (!acted) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
  }

  // Complaint anonymity: strip requester for non-HR/non-top-management
  if (request.type === 'complaint' && request.data?.anonymous) {
    if (!isTopMgmt(req.user) && req.user.department !== 'hr' && !isRequester) {
      const obj = request.toObject();
      obj.requester = { name: 'Anonymous', department: obj.department };
      return res.json({ request: obj });
    }
  }

  res.json({ request });
};

// PATCH /api/requests/:id/approve — approve current step
export const approve = async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  if (request.status === 'approved' || request.status === 'rejected') {
    return res.status(400).json({ message: 'Request already finalized' });
  }

  const stepDef = getCurrentStepDef(request);
  if (!stepDef) return res.status(400).json({ message: 'No pending step' });

  if (!canActOnStep(req.user, stepDef, request.department)) {
    return res.status(403).json({ message: 'You cannot approve this step' });
  }

  // Record step
  request.stepHistory.push({
    stepIndex: request.currentStep,
    label: stepDef.label,
    action: 'approved',
    actionBy: req.user._id,
    note: req.body.note || '',
  });

  // Advance or finalize
  if (request.currentStep + 1 >= request.totalSteps) {
    // Day-off: check and deduct leave balance
    if (request.type === 'day_off') {
      const days = countBusinessDays(request.data.startDate, request.data.endDate);
      const year = new Date(request.data.startDate).getFullYear();
      let balance = await LeaveBalance.findOne({ user: request.requester, year });
      if (!balance) {
        balance = await LeaveBalance.create({ user: request.requester, year });
      }
      if (balance.remainingDays < days) {
        // Undo the step we just pushed
        request.stepHistory.pop();
        return res.status(400).json({
          message: `Insufficient leave balance: ${balance.remainingDays} days remaining, ${days} requested`,
        });
      }
      balance.usedDays += days;
      await balance.save();
      request.leaveDays = days;
    }

    request.status = 'approved';
    request.currentStep = request.totalSteps;

    // Notify requester
    await notify({
      recipientId: request.requester,
      type: 'request_approved',
      title: `Барањето е одобрено: ${REQUEST_TYPES[request.type].label}`,
      message: `Вашето барање #${request._id.toString().slice(-6)} е одобрено`,
      link: `/requests/${request._id}`,
    });
  } else {
    request.currentStep += 1;
    request.status = 'in_progress';

    // Notify next step approvers
    const nextStep = REQUEST_TYPES[request.type].steps[request.currentStep];
    await notifyNextApprovers(request, nextStep);
  }

  await request.save();
  await request.populate('requester', 'name department');
  await request.populate('stepHistory.actionBy', 'name');
  res.json({ request });
};

// PATCH /api/requests/:id/reject — reject with note
export const reject = async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  if (request.status === 'approved' || request.status === 'rejected') {
    return res.status(400).json({ message: 'Request already finalized' });
  }

  const stepDef = getCurrentStepDef(request);
  if (!stepDef) return res.status(400).json({ message: 'No pending step' });

  if (!canActOnStep(req.user, stepDef, request.department)) {
    return res.status(403).json({ message: 'You cannot reject this step' });
  }

  request.stepHistory.push({
    stepIndex: request.currentStep,
    label: stepDef.label,
    action: 'rejected',
    actionBy: req.user._id,
    note: req.body.note || '',
  });

  request.status = 'rejected';
  await request.save();

  // Notify requester
  await notify({
    recipientId: request.requester,
    type: 'request_rejected',
    title: `Барањето е одбиено: ${REQUEST_TYPES[request.type].label}`,
    message: req.body.note
      ? `Причина: ${req.body.note}`
      : `Вашето барање #${request._id.toString().slice(-6)} е одбиено`,
    link: `/requests/${request._id}`,
  });

  await request.populate('requester', 'name department');
  await request.populate('stepHistory.actionBy', 'name');
  res.json({ request });
};

// GET /api/requests/stats/overview — aggregation for dashboard
export const stats = async (req, res) => {
  if (!isTopMgmt(req.user) && req.user.department !== 'hr') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const [byStatus, byType, byMonth] = await Promise.all([
    Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Request.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Request.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

  res.json({
    total: (statusMap.pending || 0) + (statusMap.in_progress || 0) + (statusMap.approved || 0) + (statusMap.rejected || 0),
    pending: statusMap.pending || 0,
    approved: statusMap.approved || 0,
    rejected: statusMap.rejected || 0,
    inProgress: statusMap.in_progress || 0,
    byType,
    byMonth,
  });
};
