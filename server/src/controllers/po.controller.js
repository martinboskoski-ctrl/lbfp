import PurchaseOrder, { PO_DEPARTMENTS, Q_TARGET_DEPTS } from '../models/PurchaseOrder.js';

// Only printable ASCII — no Cyrillic or other non-ASCII characters
const ASCII_RE = /^[\x20-\x7E]*$/;
const isEnglish = (str) => !str || ASCII_RE.test(str);

const isSales   = (u) => u.department === 'sales';
const isPODept  = (u) => PO_DEPARTMENTS.includes(u.department);

const POPULATE = [
  { path: 'createdBy',           select: 'name' },
  { path: 'questions.createdBy', select: 'name' },
  { path: 'questions.answeredBy',select: 'name' },
  { path: 'questions.resolvedBy',select: 'name' },
];

// ── List ──────────────────────────────────────────────────────────────────────
export const listPOs = async (req, res) => {
  if (!isPODept(req.user)) return res.status(403).json({ message: 'Access denied' });

  const pos = await PurchaseOrder.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ pos });
};

// ── Create ────────────────────────────────────────────────────────────────────
export const createPO = async (req, res) => {
  if (!isSales(req.user)) {
    return res.status(403).json({ message: 'Only Sales can create Purchase Orders' });
  }

  const { clientName, dateExpected, moq, description, products = [] } = req.body;

  if (!clientName?.trim()) return res.status(400).json({ message: 'clientName is required' });
  if (!dateExpected)       return res.status(400).json({ message: 'dateExpected is required' });
  if (!moq)                return res.status(400).json({ message: 'moq is required' });

  // English validation
  const textFields = [clientName, description, ...products.flatMap((p) => [p.productType, p.weight, p.description])];
  if (textFields.some((f) => f && !isEnglish(f))) {
    return res.status(400).json({ message: 'All text fields must be in English (ASCII only)' });
  }

  const po = await PurchaseOrder.create({
    clientName: clientName.trim(),
    dateExpected,
    moq,
    description: description?.trim() || '',
    products,
    createdBy: req.user._id,
  });

  await po.populate('createdBy', 'name');
  res.status(201).json({ po });
};

// ── Get one ───────────────────────────────────────────────────────────────────
export const getPO = async (req, res) => {
  if (!isPODept(req.user)) return res.status(403).json({ message: 'Access denied' });

  const po = await PurchaseOrder.findById(req.params.id).populate(POPULATE);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
  res.json({ po });
};

// ── Update overview (sales only) ──────────────────────────────────────────────
export const updatePO = async (req, res) => {
  if (!isSales(req.user)) return res.status(403).json({ message: 'Only Sales can edit POs' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

  const { clientName, dateExpected, moq, description, products } = req.body;

  const textFields = [clientName, description, ...(products || []).flatMap((p) => [p.productType, p.weight, p.description])];
  if (textFields.some((f) => f && !isEnglish(f))) {
    return res.status(400).json({ message: 'All text fields must be in English (ASCII only)' });
  }

  if (clientName   !== undefined) po.clientName   = clientName.trim();
  if (dateExpected !== undefined) po.dateExpected  = dateExpected;
  if (moq          !== undefined) po.moq           = moq;
  if (description  !== undefined) po.description   = description.trim();
  if (products     !== undefined) po.products       = products;

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Toggle status (sales only) ────────────────────────────────────────────────
export const toggleStatus = async (req, res) => {
  if (!isSales(req.user)) return res.status(403).json({ message: 'Only Sales can change PO status' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

  po.status = po.status === 'open' ? 'closed' : 'open';
  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Add question (sales only, to QA/R&D/Набавки) ─────────────────────────────
export const addQuestion = async (req, res) => {
  if (!isSales(req.user)) return res.status(403).json({ message: 'Only Sales can add questions' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Cannot add questions to a closed PO' });

  const { text, targetDepartment } = req.body;
  if (!text?.trim())                          return res.status(400).json({ message: 'Question text is required' });
  if (!Q_TARGET_DEPTS.includes(targetDepartment)) return res.status(400).json({ message: 'Invalid target department' });
  if (!isEnglish(text))                       return res.status(400).json({ message: 'Question must be in English (ASCII only)' });

  po.questions.push({
    text: text.trim(),
    targetDepartment,
    createdBy: req.user._id,
  });
  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Answer question (target dept only) ───────────────────────────────────────
export const answerQuestion = async (req, res) => {
  if (!isPODept(req.user) || isSales(req.user)) {
    return res.status(403).json({ message: 'Only the target department can answer' });
  }

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Cannot answer questions on a closed PO' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  if (question.targetDepartment !== req.user.department) {
    return res.status(403).json({ message: 'This question is not directed at your department' });
  }

  const { answer } = req.body;
  if (!answer?.trim()) return res.status(400).json({ message: 'Answer cannot be empty' });
  if (!isEnglish(answer)) return res.status(400).json({ message: 'Answer must be in English (ASCII only)' });

  question.answer     = answer.trim();
  question.answeredBy = req.user._id;
  question.answeredAt = new Date();

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Resolve question (sales only) ─────────────────────────────────────────────
export const resolveQuestion = async (req, res) => {
  if (!isSales(req.user)) return res.status(403).json({ message: 'Only Sales can resolve questions' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  question.resolved   = true;
  question.resolvedBy = req.user._id;
  question.resolvedAt = new Date();

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Delete PO (sales only) ────────────────────────────────────────────────────
export const deletePO = async (req, res) => {
  if (!isSales(req.user)) return res.status(403).json({ message: 'Only Sales can delete POs' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

  await po.deleteOne();
  res.json({ message: 'Purchase Order deleted' });
};
