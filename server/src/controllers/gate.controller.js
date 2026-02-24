import Project from '../models/Project.js';
import writeAudit from '../services/audit.js';
import { isPreviousGateApproved, advanceGate, rejectGate } from '../services/workflow.js';

export const approveGate = async (req, res) => {
  const { id, n } = req.params;
  const gateNumber = parseInt(n, 10);

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  // Guard: only managers and top_management can approve gates
  const canAct = req.user.isManager || req.user.department === 'top_management' || req.user.role === 'admin';
  if (!canAct) {
    return res.status(403).json({ message: 'Само менаџери можат да одобруваат порти' });
  }

  const gate = project.gates[gateNumber];
  if (!gate) return res.status(400).json({ message: 'Invalid gate number' });
  if (gate.status !== 'in_progress') {
    return res.status(400).json({ message: `Gate ${gateNumber} is not in progress` });
  }
  if (!isPreviousGateApproved(project, gateNumber)) {
    return res.status(400).json({ message: 'Previous gate must be approved first' });
  }

  gate.approvedBy = req.user._id;
  gate.approvedAt = new Date();

  const advanced = await advanceGate(project, gateNumber);
  if (!advanced && gateNumber < 4) {
    return res.status(400).json({ message: 'Cannot advance gate — check file requirements' });
  }

  // If final gate (4), just mark approved
  if (gateNumber === 4) {
    gate.status = 'approved';
    project.status = 'locked';
  }

  await project.save();
  await writeAudit({
    projectId: project._id,
    userId: req.user._id,
    action: `gate_${gateNumber}_approved`,
    details: { gateNumber },
  });

  res.json({ project });
};

export const rejectGateHandler = async (req, res) => {
  const { id, n } = req.params;
  const gateNumber = parseInt(n, 10);
  const { reason } = req.body;

  if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const canAct = req.user.isManager || req.user.department === 'top_management' || req.user.role === 'admin';
  if (!canAct) {
    return res.status(403).json({ message: 'Само менаџери можат да одбиваат порти' });
  }

  const gate = project.gates[gateNumber];
  if (!gate) return res.status(400).json({ message: 'Invalid gate number' });
  if (gate.status !== 'in_progress') {
    return res.status(400).json({ message: `Gate ${gateNumber} is not in progress` });
  }

  rejectGate(project, gateNumber, reason);
  await project.save();

  await writeAudit({
    projectId: project._id,
    userId: req.user._id,
    action: `gate_${gateNumber}_rejected`,
    details: { gateNumber, reason },
  });

  res.json({ project });
};

export const addComment = async (req, res) => {
  const { id, n } = req.params;
  const gateNumber = parseInt(n, 10);
  const { text } = req.body;

  if (!text) return res.status(400).json({ message: 'Comment text is required' });

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const gate = project.gates[gateNumber];
  if (!gate) return res.status(400).json({ message: 'Invalid gate number' });

  gate.comments.push({ author: req.user._id, text });
  await project.save();

  await writeAudit({
    projectId: project._id,
    userId: req.user._id,
    action: 'comment_added',
    details: { gateNumber },
  });

  const updated = await Project.findById(id).populate('gates.comments.author', 'name email');
  res.json({ gate: updated.gates[gateNumber] });
};

export const dispatchGate4Feedback = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (String(project.owner) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the project owner can dispatch feedback' });
  }

  if (project.currentGate !== 4) {
    return res.status(400).json({ message: 'Project must be at Gate 4 to dispatch feedback' });
  }

  project.clientFeedbackDispatched = true;
  await project.save();

  await writeAudit({
    projectId: project._id,
    userId: req.user._id,
    action: 'gate_4_feedback_dispatched',
  });

  res.json({ project });
};

export const acknowledgeGate4 = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (req.user.role !== 'client' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only clients can acknowledge' });
  }

  if (!project.clientFeedbackDispatched) {
    return res.status(400).json({ message: 'Feedback has not been dispatched yet' });
  }

  project.clientAcknowledged = true;
  project.gates[4].status = 'approved';
  project.status = 'locked';
  await project.save();

  await writeAudit({
    projectId: project._id,
    userId: req.user._id,
    action: 'gate_4_client_acknowledged',
  });

  res.json({ project });
};
