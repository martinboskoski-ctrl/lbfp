import Task from '../models/Task.js';

const POPULATE_FIELDS = [
  { path: 'assignedTo', select: 'name department' },
  { path: 'createdBy',  select: 'name department' },
  { path: 'approvedBy', select: 'name' },
  { path: 'project',    select: 'title' },
];

const isTopMgmt  = (u) => u.department === 'top_management';
const isManager  = (u) => u.isManager || isTopMgmt(u);

export const listTasks = async (req, res) => {
  const u = req.user;
  let query = {};

  if (isTopMgmt(u)) {
    if (req.query.dept) query.department = req.query.dept;
  } else if (u.isManager) {
    query.department = u.department;
  } else {
    // Plain employee — own tasks only
    query.assignedTo = u._id;
  }

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

export const updateStatus = async (req, res) => {
  const u    = req.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const { direction } = req.body; // 'forward' | 'backward'
  if (!['forward','backward'].includes(direction)) {
    return res.status(400).json({ message: 'direction must be "forward" or "backward"' });
  }

  const STATUSES = ['todo','in_progress','done','approved'];
  const idx = STATUSES.indexOf(task.status);

  // Employees can only move their own tasks between todo/in_progress/done
  const isAssignee = String(task.assignedTo) === String(u._id);
  const canAct     = isAssignee || isManager(u);
  if (!canAct) return res.status(403).json({ message: 'Немате дозвола' });

  // Employees cannot move to/from 'approved'
  if (!isManager(u)) {
    if (task.status === 'approved') return res.status(403).json({ message: 'Немате дозвола' });
    if (direction === 'forward' && idx >= 2) return res.status(403).json({ message: 'Само менаџер може да одобри задача' });
  }

  const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
  if (newIdx < 0 || newIdx >= STATUSES.length) {
    return res.status(400).json({ message: 'Нема следна/претходна позиција' });
  }

  task.status = STATUSES[newIdx];
  // Clear approval data if moved backwards from approved
  if (task.status !== 'approved') {
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
