import Task from '../models/Task.js';
import { pushEditVersion } from '../models/editVersion.js';

const POPULATE_FIELDS = [
  { path: 'assignedTo', select: 'name department' },
  { path: 'createdBy',  select: 'name department' },
  { path: 'approvedBy', select: 'name' },
  { path: 'project',    select: 'title' },
  { path: 'editHistory.editedBy', select: 'name' },
  { path: 'changeRequests.requestedBy', select: 'name' },
  { path: 'changeRequests.resolvedBy',  select: 'name' },
];

const isTopMgmt  = (u) => u.department === 'top_management';
const isManager  = (u) => u.isManager || isTopMgmt(u);

export const listTasks = async (req, res) => {
  const u = req.user;
  const { dept, assignedTo } = req.query;
  let query = {};

  // Top management can browse any department (or all); everyone else — including
  // plain employees — sees the whole of their own department (team-wide board).
  if (isTopMgmt(u)) {
    if (dept) query.department = dept;
  } else {
    query.department = u.department;
  }

  // Optional narrowing by assignee (e.g. the home dashboard "my tasks" view).
  // Combined with the department lock above, this can never leak cross-dept data.
  if (assignedTo) query.assignedTo = assignedTo;

  const tasks = await Task.find(query)
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: -1 });

  res.json({ tasks });
};

export const createTask = async (req, res) => {
  const u = req.user;
  const { title, description, assignedTo, department, project, priority, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title is required' });
  }

  // Employees can only create tasks for themselves
  if (!isManager(u)) {
    const selfId     = String(u._id);
    const targetId   = String(assignedTo || u._id);
    const targetDept = department || u.department;
    if (targetId !== selfId) {
      return res.status(403).json({ message: 'Вработените можат да додаваат задачи само за себе' });
    }
    const task = await Task.create({
      title, description,
      assignedTo: u._id,
      department: targetDept,
      createdBy:  u._id,
      project:    project || undefined,
      priority:   priority || 'medium',
      deadline:   deadline || undefined,
      status:     'todo',
    });
    await task.populate(POPULATE_FIELDS);
    return res.status(201).json({ task });
  }

  // Managers / top-management — full control
  if (!assignedTo || !department) {
    return res.status(400).json({ message: 'assignedTo and department are required' });
  }

  const task = await Task.create({
    title, description,
    assignedTo, department,
    createdBy: u._id,
    project:   project || undefined,
    priority:  priority || 'medium',
    deadline:  deadline || undefined,
    status:    'todo',
  });

  await task.populate(POPULATE_FIELDS);
  res.status(201).json({ task });
};

// Update editable fields (title, description, priority, deadline, project).
// Allowed: task creator, manager in the task's dept, or top management.
export const updateTask = async (req, res) => {
  const u = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = String(task.createdBy) === String(u._id);
  const isDeptMgr = u.isManager && task.department === u.department;
  if (!isCreator && !isDeptMgr && !isTopMgmt(u)) {
    return res.status(403).json({ message: 'Немате дозвола за оваа задача' });
  }

  // Once a task is approved, editing its content no longer makes sense.
  if (task.status === 'approved') {
    return res.status(409).json({ message: 'Одобрена задача не може да се измени' });
  }

  // Snapshot the current content so the change shows up as an edit with history.
  pushEditVersion(task, {
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
  }, u._id);

  const { title, description, priority, deadline, project } = req.body;

  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ message: 'title cannot be empty' });
    task.title = String(title).trim();
  }
  if (description !== undefined) task.description = String(description).trim();
  if (priority !== undefined) {
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ message: 'invalid priority' });
    }
    task.priority = priority;
  }
  if (deadline !== undefined) task.deadline = deadline || undefined;
  if (project  !== undefined) task.project  = project  || undefined;

  await task.save();
  await task.populate(POPULATE_FIELDS);
  res.json({ task });
};

export const updateStatus = async (req, res) => {
  const u    = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const { direction, status } = req.body; // either a target `status` or a `direction`
  const STATUSES = ['todo','in_progress','done','approved'];

  // Resolve the target status — direct (drag & drop) or relative (legacy arrows).
  let newStatus;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: 'invalid status' });
    }
    newStatus = status;
  } else if (['forward','backward'].includes(direction)) {
    const idx    = STATUSES.indexOf(task.status);
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STATUSES.length) {
      return res.status(400).json({ message: 'Нема следна/претходна позиција' });
    }
    newStatus = STATUSES[newIdx];
  } else {
    return res.status(400).json({ message: 'status or direction is required' });
  }

  // Employees can only move their own tasks between todo/in_progress/done
  const isAssignee = String(task.assignedTo) === String(u._id);
  const canAct     = isAssignee || isManager(u);
  if (!canAct) return res.status(403).json({ message: 'Немате дозвола' });

  // Only managers can move a task to or away from 'approved'
  if (!isManager(u) && (task.status === 'approved' || newStatus === 'approved')) {
    return res.status(403).json({ message: 'Само менаџер може да одобри задача' });
  }

  task.status = newStatus;
  if (newStatus === 'approved') {
    // Dragging straight into Одобрено counts as an approval.
    task.approvedBy = u._id;
    task.approvedAt = new Date();
  } else {
    task.approvedBy = undefined;
    task.approvedAt = undefined;
  }
  await task.save();
  await task.populate(POPULATE_FIELDS);
  res.json({ task });
};

export const approveTask = async (req, res) => {
  const u = req.user;
  if (!isManager(u)) return res.status(403).json({ message: 'Само менаџери можат да одобруваат задачи' });

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.status !== 'done') {
    return res.status(400).json({ message: 'Само завршени задачи можат да се одобрат' });
  }

  task.status     = 'approved';
  task.approvedBy = u._id;
  task.approvedAt = new Date();
  await task.save();
  await task.populate(POPULATE_FIELDS);
  res.json({ task });
};

export const deleteTask = async (req, res) => {
  const u    = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = String(task.createdBy) === String(u._id);
  if (!isCreator && !isTopMgmt(u)) {
    return res.status(403).json({ message: 'Немате дозвола да ја избришете оваа задача' });
  }

  await task.deleteOne();
  res.json({ message: 'Задачата е избришана' });
};

// The assignee can't edit the task, but they can request a change (deadline,
// description, goals…) which the task-giver then applies.
export const requestChange = async (req, res) => {
  const u    = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isAssignee = String(task.assignedTo) === String(u._id);
  if (!isAssignee) {
    return res.status(403).json({ message: 'Само задолженото лице може да побара измена' });
  }

  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Описот на измената е задолжителен' });

  task.changeRequests.push({ requestedBy: u._id, message: message.trim() });
  await task.save();
  await task.populate(POPULATE_FIELDS);
  res.status(201).json({ task });
};

// The task-giver (creator / dept manager / top management) marks a request resolved.
export const resolveChangeRequest = async (req, res) => {
  const u    = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = String(task.createdBy) === String(u._id);
  const isDeptMgr = u.isManager && task.department === u.department;
  if (!isCreator && !isDeptMgr && !isTopMgmt(u)) {
    return res.status(403).json({ message: 'Немате дозвола' });
  }

  const cr = task.changeRequests.id(req.params.crId);
  if (!cr) return res.status(404).json({ message: 'Барањето не е пронајдено' });

  cr.status = 'resolved';
  cr.resolvedBy = u._id;
  cr.resolvedAt = new Date();
  await task.save();
  await task.populate(POPULATE_FIELDS);
  res.json({ task });
};
