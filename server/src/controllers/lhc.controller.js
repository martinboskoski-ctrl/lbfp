import LhcCategory from '../models/LhcCategory.js';
import LhcQuestion from '../models/LhcQuestion.js';
import LhcCampaign from '../models/LhcCampaign.js';
import LhcAssignment from '../models/LhcAssignment.js';
import LhcAnswer from '../models/LhcAnswer.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../config/socket.js';
import { evaluateAssignment, aggregateCampaign } from '../services/lhcEvaluator.js';

const isTopMgmt = (u) => u?.department === 'top_management';

const requireTopMgmt = (req, res) => {
  if (!isTopMgmt(req.user)) {
    res.status(403).json({ message: 'Forbidden — top management only' });
    return false;
  }
  return true;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const POPULATE_CAMPAIGN = [
  { path: 'createdBy', select: 'name department' },
  { path: 'closedBy',  select: 'name department' },
];

const sample = (arr, n) => {
  if (!Array.isArray(arr) || n >= arr.length) return [...arr];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

const eligibleUsersForCampaign = async (campaign) => {
  const filter = { active: { $ne: false } };
  if (campaign.audienceMode === 'managers_only') {
    filter.$or = [{ isManager: true }, { department: 'top_management' }];
  } else if (campaign.audienceMode === 'departments') {
    filter.department = { $in: campaign.audienceDepartments || [] };
  }
  return User.find(filter).select('_id department isManager').lean();
};

// Snapshot a question into a lean shape for the participant.
const projectQuestion = (q) => ({
  qid: q.qid,
  category: q.category,
  subCategory: q.subCategory,
  text: q.text,
  textEn: q.textEn,
  article: q.article,
  articleEn: q.articleEn,
  type: q.type,
  options: q.options,
});

// ─────────────────────────────────────────────────────────────────────────────
// Read-only listing
// ─────────────────────────────────────────────────────────────────────────────

export const listCategories = async (_req, res) => {
  try {
    const categories = await LhcCategory.find({ active: true }).sort({ order: 1, key: 1 }).lean();
    const counts = await LhcQuestion.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$category', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.n]));
    res.json({
      categories: categories.map((c) => ({ ...c, questionCount: countMap[c.key] || 0 })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listQuestions = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const questions = await LhcQuestion.find(filter)
      .sort({ category: 1, qid: 1 })
      .limit(limit)
      .lean();
    res.json({ questions, total: questions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOverview = async (req, res) => {
  try {
    const u = req.user;
    const myAssignments = await LhcAssignment.find({ user: u._id })
      .populate({ path: 'campaign', select: 'title status openAt closeAt categories' })
      .sort({ createdAt: -1 })
      .lean();

    const payload = { myAssignments };

    if (isTopMgmt(u)) {
      const campaigns = await LhcCampaign.find({})
        .populate(POPULATE_CAMPAIGN)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      payload.campaigns = campaigns;
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns (top mgmt)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_CAMPAIGN_FIELDS = [
  'title', 'description', 'categories',
  'audienceMode', 'audienceDepartments',
  'questionsPerCategory', 'pickStrategy',
  'openAt', 'closeAt',
];

export const createCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ message: 'Насловот е задолжителен' });
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return res.status(400).json({ message: 'Изберете барем една област' });
    }

    const data = { createdBy: req.user._id };
    for (const k of ALLOWED_CAMPAIGN_FIELDS) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (!data.closeAt && data.openAt) {
      const open = new Date(data.openAt);
      open.setDate(open.getDate() + 15);
      data.closeAt = open;
    }
    const campaign = await LhcCampaign.create(data);
    await campaign.populate(POPULATE_CAMPAIGN);
    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'draft') {
      return res.status(400).json({ message: 'Може да се менува само додека е драфт' });
    }
    for (const k of ALLOWED_CAMPAIGN_FIELDS) {
      if (req.body[k] !== undefined) c[k] = req.body[k];
    }
    await c.save();
    await c.populate(POPULATE_CAMPAIGN);
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCampaign = async (req, res) => {
  try {
    const c = await LhcCampaign.findById(req.params.id).populate(POPULATE_CAMPAIGN).lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (!isTopMgmt(req.user)) {
      // Non-admins: only see campaigns they participate in.
      const own = await LhcAssignment.findOne({ campaign: c._id, user: req.user._id }).lean();
      if (!own) return res.status(403).json({ message: 'Forbidden' });
    }
    // Participation stats
    const assignments = await LhcAssignment.find({ campaign: c._id })
      .select('user status score maxScore violations completedAt')
      .lean();
    const stats = {
      invited: assignments.length,
      started: assignments.filter((a) => a.status !== 'not_started').length,
      completed: assignments.filter((a) => a.status === 'completed').length,
    };
    res.json({ campaign: c, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const openCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'draft') {
      return res.status(400).json({ message: 'Само драфт кампања може да се отвори' });
    }

    if (!c.openAt) c.openAt = new Date();
    if (!c.closeAt) {
      const close = new Date(c.openAt);
      close.setDate(close.getDate() + 15);
      c.closeAt = close;
    }

    // Enumerate eligible users
    const users = await eligibleUsersForCampaign(c);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Нема корисници во избраната целна група' });
    }

    // Pull active questions for chosen categories
    const allQuestions = await LhcQuestion.find({
      category: { $in: c.categories },
      active: true,
    }).select('qid category').lean();
    if (allQuestions.length === 0) {
      return res.status(400).json({ message: 'Нема активни прашања во избраните области' });
    }

    const byCategory = {};
    for (const q of allQuestions) {
      (byCategory[q.category] ||= []).push(q.qid);
    }

    // Create assignments per user with random pick per category
    const assignmentsToInsert = [];
    for (const u of users) {
      const qids = [];
      for (const cat of c.categories) {
        const pool = byCategory[cat] || [];
        if (c.pickStrategy === 'all' || !c.questionsPerCategory) {
          qids.push(...pool);
        } else {
          qids.push(...sample(pool, c.questionsPerCategory));
        }
      }
      assignmentsToInsert.push({
        campaign: c._id,
        user: u._id,
        questionIds: qids,
        status: 'not_started',
      });
    }

    // Idempotent: skip duplicates if any (unique index will reject)
    await LhcAssignment.insertMany(assignmentsToInsert, { ordered: false }).catch((err) => {
      if (err?.code !== 11000) throw err;
    });

    c.status = 'open';
    await c.save();

    // Notify each participant
    for (const u of users) {
      const notif = await Notification.create({
        recipient: u._id,
        type: 'lhc_open',
        title: `Започна правен здравствен преглед: „${c.title}"`,
        message: `Имате до ${new Date(c.closeAt).toLocaleDateString('mk-MK')} да го пополните.`,
        link: `/lhc/campaigns/${c._id}/answer`,
        metadata: { campaignId: c._id },
      });
      try { emitToUser(String(u._id), 'notification:new', notif); } catch { /* socket optional */ }
    }

    await c.populate(POPULATE_CAMPAIGN);
    res.json({ campaign: c, invited: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Internal: closes a single campaign. Recomputes per-assignment and
// resultSummary. Idempotent.
export const closeCampaignById = async (campaignId, closedByUserId = null) => {
  const c = await LhcCampaign.findById(campaignId);
  if (!c) return null;
  if (c.status === 'closed' || c.status === 'archived') return c;

  // Pull all questions referenced by any assignment in this campaign.
  const assignments = await LhcAssignment.find({ campaign: c._id });
  const allQids = new Set();
  for (const a of assignments) for (const qid of a.questionIds) allQids.add(qid);
  const questions = await LhcQuestion.find({ qid: { $in: [...allQids] } }).lean();
  const questionsByQid = new Map(questions.map((q) => [q.qid, q]));

  // Pull all answers and group by user.
  const answers = await LhcAnswer.find({ campaign: c._id }).lean();
  const answersByUser = {};
  for (const a of answers) {
    (answersByUser[String(a.user)] ||= {})[a.questionId] = a.answer;
  }

  // Evaluate every assignment, persist scores.
  const evaluatedAnswers = [];
  for (const a of assignments) {
    const userAnswers = answersByUser[String(a.user)] || {};
    const userQuestions = new Map(
      a.questionIds.map((qid) => [qid, questionsByQid.get(qid)]).filter(([, q]) => q)
    );
    const result = evaluateAssignment(userAnswers, userQuestions);
    a.score = result.score;
    a.maxScore = result.maxScore;
    a.violations = result.violations;
    a.categoryBreakdown = result.categoryBreakdown;
    if (a.status !== 'completed' && Object.keys(userAnswers).length > 0) {
      a.status = 'completed';
      a.completedAt = a.completedAt || new Date();
    }
    await a.save();

    // Persist per-answer snapshot for the top-violations report.
    for (const r of result.perAnswer) {
      evaluatedAnswers.push({
        questionId: r.qid,
        isCorrect: r.isCorrect,
        sanctionLevel: r.sanctionLevel,
      });
      // Update LhcAnswer with computed flags.
      await LhcAnswer.updateOne(
        { campaign: c._id, user: a.user, questionId: r.qid },
        { $set: { isCorrect: r.isCorrect, weight: r.weight, sanctionLevel: r.sanctionLevel } }
      );
    }
  }

  // Aggregate campaign-level summary.
  c.resultSummary = aggregateCampaign(assignments.map((a) => a.toObject()), evaluatedAnswers, questionsByQid);
  c.status = 'closed';
  c.closedAt = new Date();
  if (closedByUserId) c.closedBy = closedByUserId;
  await c.save();

  // Notify top management
  const tops = await User.find({ department: 'top_management' }).select('_id').lean();
  for (const t of tops) {
    const notif = await Notification.create({
      recipient: t._id,
      type: 'lhc_closed',
      title: `Завршен правен здравствен преглед: „${c.title}"`,
      message: `Учесници: ${c.resultSummary?.participation?.completed || 0}/${c.resultSummary?.participation?.invited || 0}. Прегледајте ги резултатите.`,
      link: `/lhc/campaigns/${c._id}/results`,
      metadata: { campaignId: c._id },
    });
    try { emitToUser(String(t._id), 'notification:new', notif); } catch { /* */ }
  }

  return c;
};

export const closeCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await closeCampaignById(req.params.id, req.user._id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    await c.populate(POPULATE_CAMPAIGN);
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'draft' && c.status !== 'archived') {
      return res.status(400).json({ message: 'Може да се избрише само драфт или архивирана кампања' });
    }
    await LhcAssignment.deleteMany({ campaign: c._id });
    await LhcAnswer.deleteMany({ campaign: c._id });
    await c.deleteOne();
    res.json({ message: 'Избришано' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Questionnaire (participants)
// ─────────────────────────────────────────────────────────────────────────────

export const getMyAssignment = async (req, res) => {
  try {
    const c = await LhcCampaign.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    const a = await LhcAssignment.findOne({ campaign: c._id, user: req.user._id });
    if (!a) return res.status(403).json({ message: 'Не сте поканети' });

    // Lazy-mark in_progress on first fetch
    if (a.status === 'not_started' && c.status === 'open') {
      a.status = 'in_progress';
      a.startedAt = new Date();
      await a.save();
    }

    const questions = await LhcQuestion.find({ qid: { $in: a.questionIds } }).lean();
    const questionsByQid = new Map(questions.map((q) => [q.qid, q]));
    const orderedQuestions = a.questionIds
      .map((qid) => questionsByQid.get(qid))
      .filter(Boolean)
      .map(projectQuestion);

    const answers = await LhcAnswer.find({ campaign: c._id, user: req.user._id }).lean();
    const answersMap = Object.fromEntries(answers.map((x) => [x.questionId, x.answer]));

    res.json({
      campaign: c,
      assignment: {
        _id: a._id,
        status: a.status,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        score: a.score,
        maxScore: a.maxScore,
      },
      questions: orderedQuestions,
      answers: answersMap,
      isClosed: c.status !== 'open',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveAnswer = async (req, res) => {
  try {
    const { qid, answer } = req.body || {};
    if (!qid) return res.status(400).json({ message: 'qid is required' });

    const c = await LhcCampaign.findById(req.params.id).select('status').lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'open') {
      return res.status(400).json({ message: 'Кампањата не е отворена' });
    }
    const a = await LhcAssignment.findOne({ campaign: c._id, user: req.user._id });
    if (!a) return res.status(403).json({ message: 'Не сте поканети' });
    if (a.status === 'completed') {
      return res.status(400).json({ message: 'Прегледот е поднесен и не може повеќе да се менува' });
    }
    if (!a.questionIds.includes(qid)) {
      return res.status(400).json({ message: 'Прашањето не е во вашата серија' });
    }

    await LhcAnswer.updateOne(
      { campaign: c._id, user: req.user._id, questionId: qid },
      { $set: { answer, answeredAt: new Date() } },
      { upsert: true }
    );

    if (a.status === 'not_started') {
      a.status = 'in_progress';
      a.startedAt = new Date();
      await a.save();
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'open') {
      return res.status(400).json({ message: 'Кампањата не е отворена' });
    }
    const a = await LhcAssignment.findOne({ campaign: c._id, user: req.user._id });
    if (!a) return res.status(403).json({ message: 'Не сте поканети' });
    if (a.status === 'completed') {
      return res.json({ ok: true, alreadyCompleted: true });
    }

    // Evaluate now (on submit) so the participant gets immediate score on close
    const questions = await LhcQuestion.find({ qid: { $in: a.questionIds } }).lean();
    const questionsByQid = new Map(questions.map((q) => [q.qid, q]));
    const answers = await LhcAnswer.find({ campaign: c._id, user: req.user._id }).lean();
    const answersMap = Object.fromEntries(answers.map((x) => [x.questionId, x.answer]));

    const result = evaluateAssignment(answersMap, questionsByQid);
    a.score = result.score;
    a.maxScore = result.maxScore;
    a.violations = result.violations;
    a.categoryBreakdown = result.categoryBreakdown;
    a.status = 'completed';
    a.completedAt = new Date();
    await a.save();

    // Update LhcAnswer snapshots
    for (const r of result.perAnswer) {
      await LhcAnswer.updateOne(
        { campaign: c._id, user: req.user._id, questionId: r.qid },
        { $set: { isCorrect: r.isCorrect, weight: r.weight, sanctionLevel: r.sanctionLevel } }
      );
    }

    res.json({ ok: true, score: a.score, maxScore: a.maxScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Results (top mgmt)
// ─────────────────────────────────────────────────────────────────────────────

export const getCampaignResults = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id).populate(POPULATE_CAMPAIGN).lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });

    const assignments = await LhcAssignment.find({ campaign: c._id })
      .populate({ path: 'user', select: 'name department isManager' })
      .lean();

    res.json({
      campaign: c,
      assignments,
      summary: c.resultSummary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lhc/campaigns/:id/my-result
// User's own findings — available after submit OR after campaign closed.
export const getMyResult = async (req, res) => {
  try {
    const c = await LhcCampaign.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });

    const a = await LhcAssignment.findOne({ campaign: c._id, user: req.user._id }).lean();
    if (!a) return res.status(403).json({ message: 'Не сте поканети' });

    const isReady = a.status === 'completed' || c.status === 'closed' || c.status === 'archived';
    if (!isReady) {
      return res.status(400).json({ message: 'Резултатот е достапен по поднесување или затворање на прегледот' });
    }

    const questions = await LhcQuestion.find({ qid: { $in: a.questionIds } }).lean();
    const questionsByQid = new Map(questions.map((q) => [q.qid, q]));
    const answers = await LhcAnswer.find({ campaign: c._id, user: req.user._id }).lean();

    const findings = answers.map((ans) => {
      const q = questionsByQid.get(ans.questionId);
      if (!q) return null;
      return {
        qid: q.qid,
        category: q.category,
        subCategory: q.subCategory,
        text: q.text,
        textEn: q.textEn,
        article: q.article,
        articleEn: q.articleEn,
        type: q.type,
        options: q.options,
        userAnswer: ans.answer,
        isCorrect: ans.isCorrect,
        sanctionLevel: ans.sanctionLevel || q.sanctionLevel,
        recommendation: q.recommendation,
        recommendationEn: q.recommendationEn,
      };
    }).filter(Boolean);

    res.json({
      campaign: { _id: c._id, title: c.title, status: c.status, openAt: c.openAt, closeAt: c.closeAt, closedAt: c.closedAt },
      assignment: {
        status: a.status,
        score: a.score,
        maxScore: a.maxScore,
        violations: a.violations,
        categoryBreakdown: a.categoryBreakdown,
      },
      findings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Question admin (top mgmt)
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_FIELDS = [
  'category', 'subCategory', 'text', 'textEn', 'article', 'articleEn', 'type', 'options',
  'correctAnswer', 'weight', 'sanctionLevel', 'recommendation', 'recommendationEn', 'active',
];

const VALID_TYPES = ['yes_no', 'yes_no_na', 'yes_partial_no', 'choice', 'multi_check', 'true_false'];
const VALID_SANCTIONS = ['high', 'medium', 'low', 'none'];

const validateQuestionPayload = (body, partial = false) => {
  const errs = [];
  if (!partial || body.type !== undefined) {
    if (!VALID_TYPES.includes(body.type)) errs.push('Invalid type');
  }
  if (body.sanctionLevel !== undefined && !VALID_SANCTIONS.includes(body.sanctionLevel)) {
    errs.push('Invalid sanctionLevel');
  }
  if (!partial) {
    if (!body.category) errs.push('category is required');
    if (!body.text) errs.push('text is required');
  }
  if (['choice', 'multi_check'].includes(body.type) && (!Array.isArray(body.options) || body.options.length === 0)) {
    errs.push('options[] required for choice/multi_check');
  }
  return errs;
};

export const createQuestion = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const errs = validateQuestionPayload(req.body);
    if (errs.length) return res.status(400).json({ message: errs.join('; ') });

    // Verify category exists
    const cat = await LhcCategory.findOne({ key: req.body.category }).lean();
    if (!cat) return res.status(400).json({ message: `Unknown category "${req.body.category}"` });

    // Generate qid: <category>_q<n+1> based on highest existing in that category
    const existing = await LhcQuestion.find({ category: req.body.category, qid: { $regex: `^${req.body.category}_q\\d+$` } })
      .select('qid').lean();
    const maxN = existing.reduce((m, q) => {
      const n = parseInt(q.qid.match(/_q(\d+)$/)?.[1] || '0', 10);
      return Math.max(m, n);
    }, 0);
    const qid = `${req.body.category}_q${maxN + 1}`;

    const data = { qid };
    for (const k of QUESTION_FIELDS) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    }
    data.sourceMeta = { manual: true };
    const q = await LhcQuestion.create(data);
    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const q = await LhcQuestion.findOne({ qid: req.params.qid });
    if (!q) return res.status(404).json({ message: 'Прашањето не е пронајдено' });

    const errs = validateQuestionPayload(req.body, true);
    if (errs.length) return res.status(400).json({ message: errs.join('; ') });

    for (const k of QUESTION_FIELDS) {
      if (req.body[k] !== undefined) q[k] = req.body[k];
    }
    await q.save();
    res.json({ question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    // Soft-delete: just deactivate so existing campaign references stay valid.
    const q = await LhcQuestion.findOneAndUpdate(
      { qid: req.params.qid },
      { $set: { active: false } },
      { new: true }
    );
    if (!q) return res.status(404).json({ message: 'Прашањето не е пронајдено' });
    res.json({ ok: true, question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Reopen / archive
// ─────────────────────────────────────────────────────────────────────────────

export const reopenCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'closed') {
      return res.status(400).json({ message: 'Може да се отвори само затворена кампања' });
    }
    if (c.closeAt && new Date(c.closeAt) <= new Date()) {
      // Push closeAt out to keep the window meaningful.
      const close = new Date();
      close.setDate(close.getDate() + 7);
      c.closeAt = close;
    }
    c.status = 'open';
    c.closedAt = null;
    c.closedBy = null;
    c.resultSummary = null;
    await c.save();
    await c.populate(POPULATE_CAMPAIGN);
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const archiveCampaign = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });
    if (c.status !== 'closed') {
      return res.status(400).json({ message: 'Може да се архивира само затворена кампања' });
    }
    c.status = 'archived';
    await c.save();
    await c.populate(POPULATE_CAMPAIGN);
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV export
// ─────────────────────────────────────────────────────────────────────────────

const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const exportCampaignCsv = async (req, res) => {
  try {
    if (!requireTopMgmt(req, res)) return;
    const c = await LhcCampaign.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Кампањата не е пронајдена' });

    const assignments = await LhcAssignment.find({ campaign: c._id })
      .populate({ path: 'user', select: 'name email department isManager' })
      .lean();

    const rows = [
      ['Campaign', csvEscape(c.title)],
      ['Status', c.status],
      ['Open at', c.openAt],
      ['Close at', c.closeAt],
      [],
      ['Name', 'Email', 'Department', 'IsManager', 'Status', 'Score', 'MaxScore', 'Percent', 'Violations', 'CompletedAt'],
    ];

    for (const a of assignments) {
      const pct = a.maxScore ? Math.round((a.score / a.maxScore) * 100) : '';
      rows.push([
        csvEscape(a.user?.name),
        csvEscape(a.user?.email),
        csvEscape(a.user?.department),
        a.user?.isManager ? 'yes' : 'no',
        a.status,
        a.score?.toFixed?.(2) ?? '',
        a.maxScore?.toFixed?.(2) ?? '',
        pct,
        a.violations || 0,
        a.completedAt || '',
      ]);
    }

    rows.push([]);
    rows.push(['Top violations']);
    rows.push(['Severity', 'Category', 'Count', 'Question', 'Article', 'Recommendation']);
    for (const v of (c.resultSummary?.topViolations || [])) {
      rows.push([
        v.sanctionLevel,
        v.category,
        v.count,
        csvEscape(v.text),
        csvEscape(v.article),
        csvEscape(v.recommendation),
      ]);
    }

    const csv = '﻿' + rows.map((r) => r.join(',')).join('\n');
    const filename = `lhc-${c._id}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Auto-close (called from app.js setInterval)
// ─────────────────────────────────────────────────────────────────────────────

export const autoCloseCampaigns = async () => {
  const now = new Date();
  const toClose = await LhcCampaign.find({
    status: 'open',
    closeAt: { $lte: now },
  }).select('_id');
  let n = 0;
  for (const c of toClose) {
    await closeCampaignById(c._id);
    n++;
  }
  return n;
};
