import Procedure from '../models/Procedure.js';

const isTopMgmt = (u) => u.department === 'top_management';

export const list = async (req, res) => {
  let filter = {};
  if (!isTopMgmt(req.user)) {
    filter = {
      $or: [
        { departments: { $size: 0 } },
        { departments: req.user.department },
      ],
    };
  }
  const procedures = await Procedure.find(filter)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ procedures });
};

export const create = async (req, res) => {
  if (!isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Само топ менаџмент може да креира процедури' });
  }

  const { title, content, departments } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }

  const procedure = await Procedure.create({
    title,
    content,
    createdBy: req.user._id,
    departments: departments || [],
  });
  await procedure.populate('createdBy', 'name');
  res.status(201).json({ procedure });
};

export const getOne = async (req, res) => {
  const procedure = await Procedure.findById(req.params.id)
    .populate('createdBy', 'name');
  if (!procedure) return res.status(404).json({ message: 'Procedure not found' });

  if (
    procedure.departments.length > 0 &&
    !isTopMgmt(req.user) &&
    !procedure.departments.includes(req.user.department)
  ) {
    return res.status(403).json({ message: 'Немате пристап до оваа процедура' });
  }

  res.json({ procedure });
};

export const remove = async (req, res) => {
  if (!isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Само топ менаџмент може да брише процедури' });
  }

  const procedure = await Procedure.findById(req.params.id);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found' });

  await procedure.deleteOne();
  res.json({ message: 'Процедурата е избришана' });
};
