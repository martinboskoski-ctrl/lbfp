import Procedure from '../models/Procedure.js';
import { writeProcedurePdf } from '../services/procedurePdf.js';

const isTopMgmt = (u) => u.department === 'top_management';

// Procedures are company-wide reading: everyone sees all of them. `departments`
// tags which sectors a procedure applies to (empty = general) and drives filtering.
export const list = async (req, res) => {
  const procedures = await Procedure.find()
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
  res.json({ procedure });
};

// GET /api/procedures/:id/pdf — the procedure as a downloadable A4 PDF.
export const downloadPdf = async (req, res) => {
  const procedure = await Procedure.findById(req.params.id).lean();
  if (!procedure) return res.status(404).json({ message: 'Procedure not found' });

  const filename = `${procedure.title.replace(/[\\/:*?"<>|]+/g, ' ').trim()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="procedure.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  writeProcedurePdf(procedure, res);
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
