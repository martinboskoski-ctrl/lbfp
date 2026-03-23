import MaintenanceRequest from '../models/MaintenanceRequest.js';

const isTopMgmt = (u) => u.department === 'top_management';

const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1 };

// GET /api/maintenance — list maintenance requests
export const list = async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (isTopMgmt(req.user)) {
    // Top management sees all
  } else if (req.user.isManager) {
    // Managers see their department's requests plus any assigned to their dept users
    filter.$or = [
      { department: req.user.department },
      { assignedTo: req.user._id },
    ];
  } else {
    // Regular employees see only ones they reported
    filter.reportedBy = req.user._id;
  }

  const requests = await MaintenanceRequest.find(filter)
    .populate('reportedBy', 'name department')
    .populate('assignedTo', 'name department')
    .sort({ createdAt: -1 });

  // Sort by priority desc (urgent first), then createdAt desc
  requests.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return b.createdAt - a.createdAt;
  });

  res.json({ requests });
};

// POST /api/maintenance — create a maintenance request
export const create = async (req, res) => {
  const { title, description, machineId, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  const request = await MaintenanceRequest.create({
    title,
    description,
    machineId,
    priority,
    department: req.user.department,
    reportedBy: req.user._id,
  });

  await request.populate('reportedBy', 'name department');
  res.status(201).json({ request });
};

// GET /api/maintenance/:id — get single maintenance request
export const getOne = async (req, res) => {
  const request = await MaintenanceRequest.findById(req.params.id)
    .populate('reportedBy', 'name department')
    .populate('assignedTo', 'name department');

  if (!request) {
    return res.status(404).json({ message: 'Maintenance request not found' });
  }

  const isReporter = request.reportedBy._id.toString() === req.user._id.toString();
  const isAssigned = request.assignedTo?._id?.toString() === req.user._id.toString();
  const isDeptManager = req.user.isManager && req.user.department === request.department;

  if (!isReporter && !isAssigned && !isDeptManager && !isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ request });
};

// PUT /api/maintenance/:id — update a maintenance request
export const update = async (req, res) => {
  const request = await MaintenanceRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ message: 'Maintenance request not found' });
  }

  const isReporter = request.reportedBy.toString() === req.user._id.toString();
  const isManagerOrTop = isTopMgmt(req.user) || (req.user.isManager);

  // Reporter can update title/description only while status is 'reported'
  if (isReporter && request.status === 'reported') {
    if (req.body.title !== undefined) request.title = req.body.title;
    if (req.body.description !== undefined) request.description = req.body.description;
  }

  // Managers and top management can update status, assignedTo, resolutionNotes
  if (isManagerOrTop) {
    if (req.body.status !== undefined) {
      request.status = req.body.status;
      if (req.body.status === 'resolved' && !request.resolvedAt) {
        request.resolvedAt = new Date();
      }
    }
    if (req.body.assignedTo !== undefined) request.assignedTo = req.body.assignedTo;
    if (req.body.resolutionNotes !== undefined) request.resolutionNotes = req.body.resolutionNotes;
    if (req.body.priority !== undefined) request.priority = req.body.priority;
  } else if (!isReporter) {
    return res.status(403).json({ message: 'Access denied' });
  }

  await request.save();
  await request.populate('reportedBy', 'name department');
  await request.populate('assignedTo', 'name department');
  res.json({ request });
};
