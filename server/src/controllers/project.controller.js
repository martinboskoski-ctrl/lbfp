import Project from '../models/Project.js';
import writeAudit from '../services/audit.js';

export const listProjects = async (req, res) => {
  const u = req.user;
  let query = {};

  if (u.department !== 'top_management') {
    const accessFilter = { $or: [
      { department: u.department },
      { 'involvedDepartments.department': u.department },
    ]};
    query = req.query.dept
      ? { $and: [accessFilter, { department: req.query.dept }] }
      : accessFilter;
  } else if (req.query.dept) {
    query.department = req.query.dept;
  }

  const projects = await Project.find(query)
    .populate('owner', 'name department')
    .populate('assignedUsers', 'name department')
    .sort({ updatedAt: -1 });

  res.json({ projects });
};

export const createProject = async (req, res) => {
  const u = req.user;
  if (!u.isManager && u.department !== 'top_management') {
    return res.status(403).json({ message: 'Само менаџери можат да креираат проекти' });
  }

  const {
    title, description, priority, status,
    startDate, endDate, budget, goals,
    assignedUsers, involvedDepartments, tasks,
    department,
  } = req.body;

  if (!title || !department) {
    return res.status(400).json({ message: 'title and department are required' });
  }

  const project = await Project.create({
    title, description, owner: u._id, department,
    priority: priority || 'medium',
    status: status || 'draft',
    startDate, endDate, budget,
    goals: goals || [],
    assignedUsers: assignedUsers || [],
    involvedDepartments: (involvedDepartments || []).filter((d) => d.department !== department),
    tasks: tasks || [],
  });

  await project.populate('owner', 'name department');
  await project.populate('assignedUsers', 'name department');

  await writeAudit({ projectId: project._id, userId: u._id, action: 'project_created', details: { title } });

  res.status(201).json({ project });
};

export const getProject = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name department')
    .populate('assignedUsers', 'name department')
    .populate('tasks.assignedTo', 'name department');

  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ project });
};

export const updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const updatable = [
    'title','description','priority','status','startDate','endDate',
    'budget','goals','assignedUsers','involvedDepartments','tasks','department',
  ];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();
  await project.populate('owner', 'name department');
  await project.populate('assignedUsers', 'name department');
  await project.populate('tasks.assignedTo', 'name department');

  await writeAudit({ projectId: project._id, userId: req.user._id, action: 'project_updated' });

  res.json({ project });
};

export const getProjectFiles = async (req, res) => {
  const File = (await import('../models/File.js')).default;
  const files = await File.find({ project: req.params.id })
    .populate('uploader', 'name department')
    .sort({ version: -1 });
  res.json({ files });
};
