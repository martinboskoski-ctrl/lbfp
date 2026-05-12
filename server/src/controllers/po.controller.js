import PurchaseOrder, {
  PO_DEPARTMENTS,
  Q_TARGET_DEPTS,
  PO_STAGES,
  PO_PHASES,
} from '../models/PurchaseOrder.js';
import User from '../models/User.js';
import { getRequiredFields } from '../config/poRequiredFields.js';
import { notifyMany, notify } from '../services/notification.js';

// Only printable ASCII — no Cyrillic or other non-ASCII characters
const ASCII_RE = /^[\x20-\x7E]*$/;
const isEnglish = (str) => !str || ASCII_RE.test(str);

const isTopMgmt = (u) => u.department === 'top_management';
const isSales   = (u) => u.department === 'sales';
const canActAsSales = (u) => isSales(u) || isTopMgmt(u);
const isPODept  = (u) => PO_DEPARTMENTS.includes(u.department) || isTopMgmt(u);

// r_and_d users also handle packaging questions (no separate `packaging` user dept).
const canAnswerTarget = (user, targetDepartment) => {
  if (isTopMgmt(user)) return true;
  if (user.department === targetDepartment) return true;
  if (targetDepartment === 'packaging' && user.department === 'r_and_d') return true;
  return false;
};

// User-dept(s) that "own" answering a given target.
const answererDeptsFor = (targetDepartment) => {
  if (targetDepartment === 'packaging') return ['r_and_d'];
  return [targetDepartment];
};

const findAnswererUsers = (targetDepartment) =>
  User.find({ department: { $in: answererDeptsFor(targetDepartment) } }).select('_id').lean();

const findSalesUsers = () =>
  User.find({ department: 'sales' }).select('_id').lean();

const POPULATE = [
  { path: 'createdBy',                          select: 'name' },
  { path: 'questions.createdBy',                select: 'name' },
  { path: 'questions.answeredBy',               select: 'name' },
  { path: 'questions.resolvedBy',               select: 'name' },
  { path: 'questions.thread.author',            select: 'name' },
  { path: 'questions.salesReview.reviewedBy',   select: 'name' },
  { path: 'questions.clientApproval.loggedBy',  select: 'name' },
];

// ── List ──────────────────────────────────────────────────────────────────────
export const listPOs = async (req, res) => {
  if (!isPODept(req.user)) return res.status(403).json({ message: 'Access denied' });

  // Sales + top mgmt: see all inquiries. Target depts: only inquiries with at least
  // one question routed to them (or, for r_and_d, to packaging).
  let filter = {};
  if (!canActAsSales(req.user)) {
    const targets = [req.user.department];
    if (req.user.department === 'r_and_d') targets.push('packaging');
    filter = { 'questions.targetDepartment': { $in: targets } };
  }

  const pos = await PurchaseOrder.find(filter)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ pos });
};

// ── Create ────────────────────────────────────────────────────────────────────
export const createPO = async (req, res) => {
  if (!canActAsSales(req.user)) {
    return res.status(403).json({ message: 'Only Sales can create Pre-Order Inquiries' });
  }

  const {
    clientName,
    stage = 'pre_order',
    currentPhase = 'phase_1_idea',
    dateExpected,
    moq,
    description,
    products = [],
  } = req.body;

  if (!clientName?.trim()) return res.status(400).json({ message: 'clientName is required' });
  if (!PO_STAGES.includes(stage)) return res.status(400).json({ message: 'Invalid stage' });
  if (!PO_PHASES.includes(currentPhase)) return res.status(400).json({ message: 'Invalid phase' });

  // In `order` stage, MOQ + dateExpected are required; in `pre_order` they're optional.
  if (stage === 'order') {
    if (!dateExpected) return res.status(400).json({ message: 'dateExpected is required for orders' });
    if (!moq)          return res.status(400).json({ message: 'moq is required for orders' });
  }

  const textFields = [clientName, description, ...products.flatMap((p) => [p.productType, p.weight, p.description])];
  if (textFields.some((f) => f && !isEnglish(f))) {
    return res.status(400).json({ message: 'All text fields must be in English (ASCII only)' });
  }

  const po = await PurchaseOrder.create({
    clientName:   clientName.trim(),
    stage,
    currentPhase,
    dateExpected: dateExpected || undefined,
    moq:          moq ? Number(moq) : undefined,
    description:  description?.trim() || '',
    products,
    createdBy:    req.user._id,
  });

  await po.populate('createdBy', 'name');
  res.status(201).json({ po });
};

// ── Get one ───────────────────────────────────────────────────────────────────
export const getPO = async (req, res) => {
  if (!isPODept(req.user)) return res.status(403).json({ message: 'Access denied' });

  const po = await PurchaseOrder.findById(req.params.id).populate(POPULATE);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  // Target dept can only open an inquiry that actually has a question for them.
  if (!canActAsSales(req.user)) {
    const targets = [req.user.department];
    if (req.user.department === 'r_and_d') targets.push('packaging');
    const hasMine = po.questions.some((q) => targets.includes(q.targetDepartment));
    if (!hasMine) return res.status(403).json({ message: 'No questions for your department on this inquiry' });
  }

  res.json({ po });
};

// ── Update overview (sales only) ──────────────────────────────────────────────
export const updatePO = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can edit inquiries' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  const { clientName, stage, currentPhase, dateExpected, moq, description, products } = req.body;

  const textFields = [clientName, description, ...(products || []).flatMap((p) => [p.productType, p.weight, p.description])];
  if (textFields.some((f) => f && !isEnglish(f))) {
    return res.status(400).json({ message: 'All text fields must be in English (ASCII only)' });
  }

  if (clientName   !== undefined) po.clientName   = clientName.trim();
  if (stage        !== undefined) {
    if (!PO_STAGES.includes(stage)) return res.status(400).json({ message: 'Invalid stage' });
    po.stage = stage;
  }
  if (currentPhase !== undefined) {
    if (!PO_PHASES.includes(currentPhase)) return res.status(400).json({ message: 'Invalid phase' });
    po.currentPhase = currentPhase;
  }
  if (dateExpected !== undefined) po.dateExpected = dateExpected || undefined;
  if (moq          !== undefined) po.moq          = moq ? Number(moq) : undefined;
  if (description  !== undefined) po.description  = description.trim();
  if (products     !== undefined) po.products     = products;

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Toggle status (sales only) ────────────────────────────────────────────────
export const toggleStatus = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can change status' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  po.status = po.status === 'open' ? 'closed' : 'open';
  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Add question (sales only) ─────────────────────────────────────────────────
export const addQuestion = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can add questions' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Cannot add questions to a closed inquiry' });

  const { text, targetDepartment, phase, productRef, deadline, priority } = req.body;
  if (!text?.trim())                              return res.status(400).json({ message: 'Question text is required' });
  if (!Q_TARGET_DEPTS.includes(targetDepartment)) return res.status(400).json({ message: 'Invalid target department' });
  if (!isEnglish(text))                           return res.status(400).json({ message: 'Question must be in English (ASCII only)' });

  const effectivePhase = phase && PO_PHASES.includes(phase) ? phase : (po.currentPhase || 'phase_1_idea');

  po.questions.push({
    text: text.trim(),
    targetDepartment,
    phase: effectivePhase,
    productRef: productRef || '',
    deadline: deadline || undefined,
    priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal',
    createdBy: req.user._id,
    status: 'pending',
    requiredFields: getRequiredFields(targetDepartment, effectivePhase),
  });
  await po.save();
  await po.populate(POPULATE);

  // Notify the answerer dept(s).
  const newQ = po.questions[po.questions.length - 1];
  const answerers = await findAnswererUsers(targetDepartment);
  await notifyMany(
    answerers.map((u) => u._id).filter((id) => String(id) !== String(req.user._id)),
    {
      type: 'inquiry_question_assigned',
      title: `New question for ${targetDepartment.replace(/_/g, ' ')}`,
      message: `${po.clientName} · ${text.trim().slice(0, 120)}`,
      link: `/po/${po._id}`,
      metadata: { poId: po._id, questionId: newQ._id, phase: effectivePhase },
    }
  );

  res.json({ po });
};

// ── Post thread message (target dept or sales) ────────────────────────────────
export const postThread = async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Inquiry is closed' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const canPost = canActAsSales(req.user) || canAnswerTarget(req.user, question.targetDepartment);
  if (!canPost) return res.status(403).json({ message: 'Not allowed to post on this question' });

  const { body } = req.body;
  if (!body?.trim())     return res.status(400).json({ message: 'Body cannot be empty' });
  if (!isEnglish(body))  return res.status(400).json({ message: 'English only (ASCII)' });

  question.thread.push({
    author: req.user._id,
    body: body.trim(),
  });

  // First reply from the target dept flips pending → in_progress
  const isFromDept = canAnswerTarget(req.user, question.targetDepartment) && !isSales(req.user);
  if (question.status === 'pending' && isFromDept) {
    question.status = 'in_progress';
  }

  await po.save();
  await po.populate(POPULATE);

  // Notify the other side of the conversation.
  const snippet = body.trim().slice(0, 120);
  if (isFromDept) {
    // Dept replied → notify the sales user who asked.
    if (question.createdBy && String(question.createdBy._id || question.createdBy) !== String(req.user._id)) {
      await notify({
        recipientId: question.createdBy._id || question.createdBy,
        type: 'inquiry_reply',
        title: `Reply from ${question.targetDepartment.replace(/_/g, ' ')}`,
        message: `${po.clientName} · ${snippet}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      });
    }
  } else if (isSales(req.user) || isTopMgmt(req.user)) {
    // Sales replied → notify the answerer dept.
    const answerers = await findAnswererUsers(question.targetDepartment);
    await notifyMany(
      answerers.map((u) => u._id).filter((id) => String(id) !== String(req.user._id)),
      {
        type: 'inquiry_reply',
        title: `Sales reply on inquiry`,
        message: `${po.clientName} · ${snippet}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      }
    );
  }

  res.json({ po });
};

// ── Mark final answer (target dept only, must satisfy rubric) ────────────────
export const markFinalAnswer = async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Inquiry is closed' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  if (!canAnswerTarget(req.user, question.targetDepartment)) {
    return res.status(403).json({ message: 'Only the target department can mark a final answer' });
  }

  const { threadEntryId, answer, requiredFields = [] } = req.body;

  // Update requiredFields with the dept's filled state.
  if (Array.isArray(requiredFields)) {
    const map = new Map(requiredFields.map((rf) => [rf.key, !!rf.filled]));
    question.requiredFields = question.requiredFields.map((rf) => ({
      key: rf.key,
      label: rf.label,
      filled: map.has(rf.key) ? map.get(rf.key) : rf.filled,
    }));
  }

  const allFilled = question.requiredFields.every((rf) => rf.filled);
  if (!allFilled) {
    return res.status(400).json({
      message: 'All required fields must be checked before marking final answer',
      missing: question.requiredFields.filter((rf) => !rf.filled).map((rf) => rf.label),
    });
  }

  // Either flag an existing thread entry as final, or append `answer` as the final entry.
  let finalEntry;
  if (threadEntryId) {
    finalEntry = question.thread.id(threadEntryId);
    if (!finalEntry) return res.status(404).json({ message: 'Thread entry not found' });
    question.thread.forEach((t) => { t.isFinalAnswer = String(t._id) === String(threadEntryId); });
  } else {
    if (!answer?.trim())    return res.status(400).json({ message: 'Provide answer text or a threadEntryId' });
    if (!isEnglish(answer)) return res.status(400).json({ message: 'English only (ASCII)' });
    question.thread.forEach((t) => { t.isFinalAnswer = false; });
    question.thread.push({ author: req.user._id, body: answer.trim(), isFinalAnswer: true });
    finalEntry = question.thread[question.thread.length - 1];
  }

  question.answer     = finalEntry.body;
  question.answeredBy = req.user._id;
  question.answeredAt = new Date();
  question.status     = 'awaiting_sales_review';

  await po.save();
  await po.populate(POPULATE);

  // Notify sales — the question creator if known, otherwise all sales users.
  const recipient = question.createdBy?._id || question.createdBy;
  if (recipient && String(recipient) !== String(req.user._id)) {
    await notify({
      recipientId: recipient,
      type: 'inquiry_final_answer',
      title: 'Final answer awaiting your review',
      message: `${po.clientName} · ${question.text.slice(0, 100)}`,
      link: `/po/${po._id}`,
      metadata: { poId: po._id, questionId: question._id },
    });
  } else {
    const sales = await findSalesUsers();
    await notifyMany(
      sales.map((u) => u._id).filter((id) => String(id) !== String(req.user._id)),
      {
        type: 'inquiry_final_answer',
        title: 'Final answer awaiting sales review',
        message: `${po.clientName} · ${question.text.slice(0, 100)}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      }
    );
  }

  res.json({ po });
};

// ── Sales review (accept or needs-more) ───────────────────────────────────────
export const salesReview = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can review answers' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const { accepted, notes = '', sendToClient = false } = req.body;
  if (typeof accepted !== 'boolean') return res.status(400).json({ message: 'accepted (bool) is required' });
  if (notes && !isEnglish(notes))    return res.status(400).json({ message: 'Notes must be in English (ASCII)' });

  question.salesReview = {
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
    accepted,
    notes,
  };

  if (accepted) {
    question.status = sendToClient ? 'sent_to_client' : 'awaiting_sales_review';
  } else {
    question.status = 'needs_more';
  }

  await po.save();
  await po.populate(POPULATE);

  // Notify the answerer (dept) about the review outcome.
  const answererId = question.answeredBy?._id || question.answeredBy;
  if (answererId && String(answererId) !== String(req.user._id)) {
    if (accepted) {
      await notify({
        recipientId: answererId,
        type: 'inquiry_review_accepted',
        title: sendToClient ? 'Sales accepted & sent to client' : 'Sales accepted your answer',
        message: `${po.clientName} · ${question.text.slice(0, 100)}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      });
    } else {
      await notify({
        recipientId: answererId,
        type: 'inquiry_needs_more',
        title: 'Sales needs more info',
        message: `${po.clientName} · ${notes || question.text.slice(0, 100)}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      });
    }
  }
  // On needs_more, also notify the rest of the answerer dept so anyone can pick it up.
  if (!accepted) {
    const answerers = await findAnswererUsers(question.targetDepartment);
    await notifyMany(
      answerers
        .map((u) => u._id)
        .filter((id) => String(id) !== String(req.user._id) && String(id) !== String(answererId || '')),
      {
        type: 'inquiry_needs_more',
        title: 'Question returned for more info',
        message: `${po.clientName} · ${question.text.slice(0, 100)}`,
        link: `/po/${po._id}`,
        metadata: { poId: po._id, questionId: question._id },
      }
    );
  }

  res.json({ po });
};

// ── Log client approval / rejection (sales only) ─────────────────────────────
export const clientApproval = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can log client approval' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const { approved, clientNotes = '' } = req.body;
  if (typeof approved !== 'boolean') return res.status(400).json({ message: 'approved (bool) is required' });
  if (clientNotes && !isEnglish(clientNotes)) return res.status(400).json({ message: 'Notes must be in English (ASCII)' });

  question.clientApproval = {
    loggedBy: req.user._id,
    loggedAt: new Date(),
    approved,
    clientNotes,
  };
  question.status   = approved ? 'client_approved' : 'client_rejected';
  question.resolved = approved;
  if (approved) {
    question.resolvedBy = req.user._id;
    question.resolvedAt = new Date();
  }

  await po.save();
  await po.populate(POPULATE);

  // Notify the answerer dept so they see the client outcome.
  const answerers = await findAnswererUsers(question.targetDepartment);
  await notifyMany(
    answerers.map((u) => u._id).filter((id) => String(id) !== String(req.user._id)),
    {
      type: approved ? 'inquiry_client_approved' : 'inquiry_client_rejected',
      title: approved ? 'Client approved' : 'Client rejected',
      message: `${po.clientName} · ${question.text.slice(0, 100)}`,
      link: `/po/${po._id}`,
      metadata: { poId: po._id, questionId: question._id },
    }
  );

  res.json({ po });
};

// ── Legacy: simple answer (kept for backward compat with existing UI calls) ──
export const answerQuestion = async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });
  if (po.status === 'closed') return res.status(400).json({ message: 'Inquiry is closed' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  if (!canAnswerTarget(req.user, question.targetDepartment)) {
    return res.status(403).json({ message: 'This question is not directed at your department' });
  }

  const { answer } = req.body;
  if (!answer?.trim())    return res.status(400).json({ message: 'Answer cannot be empty' });
  if (!isEnglish(answer)) return res.status(400).json({ message: 'Answer must be in English (ASCII only)' });

  // Append to thread but DO NOT flag final — final requires rubric.
  question.thread.push({ author: req.user._id, body: answer.trim() });
  question.answer     = answer.trim();
  question.answeredBy = req.user._id;
  question.answeredAt = new Date();
  if (question.status === 'pending') question.status = 'in_progress';

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Legacy resolve (sales only) ───────────────────────────────────────────────
export const resolveQuestion = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can resolve questions' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  const question = po.questions.id(req.params.qid);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  question.resolved   = true;
  question.resolvedBy = req.user._id;
  question.resolvedAt = new Date();
  question.status     = 'client_approved';

  await po.save();
  await po.populate(POPULATE);
  res.json({ po });
};

// ── Department inbox (flat across all open inquiries) ─────────────────────────
export const deptInbox = async (req, res) => {
  if (!isPODept(req.user)) return res.status(403).json({ message: 'Access denied' });

  // Top mgmt may filter; everyone else sees their own dept.
  const dept = isTopMgmt(req.user) ? (req.query.dept || null) : req.user.department;

  const pos = await PurchaseOrder.find({ status: 'open' })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const items = [];
  for (const po of pos) {
    for (const q of po.questions || []) {
      // Sales sees all; target dept sees only its assignments
      if (isSales(req.user)) {
        // sales: all questions
      } else if (dept) {
        if (q.targetDepartment !== dept &&
            !(q.targetDepartment === 'packaging' && dept === 'r_and_d')) continue;
      }
      items.push({
        poId: po._id,
        clientName: po.clientName,
        stage: po.stage,
        currentPhase: po.currentPhase,
        question: q,
      });
    }
  }

  // Sort: pending/in_progress/needs_more first, then by deadline asc
  const priorityOrder = { pending: 0, in_progress: 1, needs_more: 2, awaiting_sales_review: 3, sent_to_client: 4, client_rejected: 5, client_approved: 6 };
  items.sort((a, b) => {
    const pa = priorityOrder[a.question.status] ?? 99;
    const pb = priorityOrder[b.question.status] ?? 99;
    if (pa !== pb) return pa - pb;
    const da = a.question.deadline ? new Date(a.question.deadline).getTime() : Infinity;
    const db = b.question.deadline ? new Date(b.question.deadline).getTime() : Infinity;
    return da - db;
  });

  res.json({ items });
};

// ── Client digest (markdown) ──────────────────────────────────────────────────
export const digest = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can generate the digest' });

  const po = await PurchaseOrder.findById(req.params.id).populate(POPULATE);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  const eligible = po.questions.filter((q) =>
    q.status === 'awaiting_sales_review' ||
    q.status === 'sent_to_client' ||
    q.status === 'client_rejected'
  );

  const lines = [];
  lines.push(`Dear Client,`);
  lines.push('');
  lines.push(`Here is the status of your current requests for ${po.clientName}:`);
  lines.push('');

  if (eligible.length === 0) {
    lines.push('_No pending answers ready to share._');
  } else {
    for (const q of eligible) {
      lines.push(`**Product:** ${q.productRef || '—'}`);
      lines.push(`**Phase:** ${q.phase}`);
      lines.push(`**Question:** ${q.text}`);
      lines.push(`**Answer:** ${q.answer || '_(no final answer yet)_'}`);
      lines.push('');
    }
  }
  lines.push('Best regards,');

  res.json({ markdown: lines.join('\n'), count: eligible.length });
};

// ── Delete PO (sales only) ────────────────────────────────────────────────────
export const deletePO = async (req, res) => {
  if (!canActAsSales(req.user)) return res.status(403).json({ message: 'Only Sales can delete inquiries' });

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ message: 'Pre-Order Inquiry not found' });

  await po.deleteOne();
  res.json({ message: 'Pre-Order Inquiry deleted' });
};
