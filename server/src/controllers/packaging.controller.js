import PackagingCheck, { PACKAGING_SECTORS } from '../models/PackagingCheck.js';
import PackagingRule from '../models/PackagingRule.js';
import User from '../models/User.js';
import { saveFile, openFileStream, readFile, deleteFile } from '../services/packagingFiles.js';
import { reviewArtwork, isAiConfigured, docxToText, AiNotConfiguredError } from '../services/packagingAi.js';
import { notifyMany } from '../services/notification.js';

const isTopMgmt = (u) => u.department === 'top_management';
const inTool = (u) => isTopMgmt(u) || PACKAGING_SECTORS.includes(u.department);
const isLead = (u) => isTopMgmt(u) || u.department === 'sales';
const canEditRules = (u) => isTopMgmt(u) || u.department === 'quality_assurance';
const canRespond = (u, remark) => isTopMgmt(u) || u.department === remark.sector;

const REVIEWER_SECTORS = PACKAGING_SECTORS.filter((s) => s !== 'sales');
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const USER_FIELDS = 'name department';
const POPULATE = [
  { path: 'createdBy', select: USER_FIELDS },
  { path: 'rounds.createdBy', select: USER_FIELDS },
  { path: 'rounds.remarks.createdBy', select: USER_FIELDS },
  { path: 'rounds.remarks.response.by', select: USER_FIELDS },
  { path: 'rounds.outcome.by', select: USER_FIELDS },
];

const httpError = (status, message) => Object.assign(new Error(message), { status });

const link = (check) => `/tools/packaging/${check._id}`;

const assertTool = (u) => {
  if (!inTool(u)) throw httpError(403, 'Немате пристап до проверката на амбалажа');
};

const loadCheck = async (id) => {
  const check = await PackagingCheck.findById(id);
  if (!check) throw httpError(404, 'Проверката не е пронајдена');
  return check;
};

const currentRound = (check) => check.rounds[check.rounds.length - 1];

const assertOpen = (check) => {
  if (check.status !== 'in_review') throw httpError(409, 'Рундата е затворена');
};

const notifySectors = async (sectors, actor, data) => {
  const users = await User.find({ department: { $in: sectors }, _id: { $ne: actor._id } }).select('_id');
  if (users.length) await notifyMany(users.map((u) => u._id), data);
};

const nextCode = async () => {
  const last = await PackagingCheck.findOne().sort({ createdAt: -1 }).select('code');
  const n = last ? parseInt(last.code.replace(/\D/g, ''), 10) + 1 : 1;
  return `ПА-${String(n).padStart(4, '0')}`;
};

// Stores whatever the client sent for this round — nothing is mandatory.
const buildRound = async (req, number, checkId) => {
  const meta = { checkId, round: number };
  const attachments = [];
  for (const file of req.files?.attachments || []) attachments.push(await saveFile(file, meta));
  const ingredientsFile = req.files?.ingredientsFile?.[0];
  return {
    number,
    clientMessage: (req.body.clientMessage || '').trim(),
    attachments,
    ingredientsFile: ingredientsFile ? await saveFile(ingredientsFile, meta) : undefined,
    ingredientsText: (req.body.ingredientsText || '').trim(),
    note: (req.body.note || '').trim(),
    createdBy: req.user._id,
  };
};

const latestRound = (check, has) => [...check.rounds].reverse().find(has);

// DOCX / TXT ingredient files are sent as text; images and PDFs as attachments.
const loadIngredients = async (round) => {
  if (!round) return { text: '', file: undefined };
  let text = round.ingredientsText;
  let file;
  if (round.ingredientsFile) {
    const buffer = await readFile(round.ingredientsFile.fileId);
    if (round.ingredientsFile.mimeType === DOCX) text = [text, docxToText(buffer)].filter(Boolean).join('\n\n');
    else if (round.ingredientsFile.mimeType === 'text/plain') text = [text, buffer.toString('utf8')].filter(Boolean).join('\n\n');
    else file = { buffer, mimeType: round.ingredientsFile.mimeType };
  }
  return { text, file };
};

const DECISION_TEXT = { approved: 'approved', changes_required: 'changes required' };

// Earlier rounds as plain text, so the AI can follow the conversation.
const conversationHistory = (rounds) => rounds.map((r) => {
  const parts = [`Round ${r.number}:`];
  if (r.clientMessage) parts.push(`Client wrote: ${r.clientMessage}`);
  parts.push(r.attachments?.length ? `Client sent ${r.attachments.length} artwork file(s).` : 'No artwork in this round.');
  const confirmed = r.remarks.filter((m) => m.status === 'confirmed').map((m) => `- ${m.text}`);
  const disputed = r.remarks.filter((m) => m.status === 'disputed').map((m) => `- ${m.text} (our team: not an issue — ${m.response?.comment || ''})`);
  if (confirmed.length) parts.push('Points we raised (confirmed by our team):', ...confirmed);
  if (disputed.length) parts.push('Points dismissed by our team:', ...disputed);
  if (r.ai?.answer) parts.push(`Our answer: ${r.ai.answer}`);
  if (r.outcome?.decision) parts.push(`Round closed: ${DECISION_TEXT[r.outcome.decision]}. ${r.outcome.summary || ''}`);
  return parts.join('\n');
}).join('\n\n');

// Runs the AI on the check's current round, using the latest artwork and ingredient
// list given anywhere in the conversation. Pending AI remarks are replaced; answered
// ones stay. Returns the remarks it added.
const runAi = async (check) => {
  const round = currentRound(check);
  const artworkRound = latestRound(check, (r) => r.attachments?.length);
  const ingredientsRound = latestRound(check, (r) => r.ingredientsText || r.ingredientsFile);

  if (!artworkRound && !round.clientMessage) {
    round.ai = { status: 'skipped', summary: '', answer: '', error: '', model: '', ranAt: undefined };
    return [];
  }

  const rules = await PackagingRule.find({ active: true }).lean();
  try {
    const attachments = artworkRound
      ? await Promise.all(artworkRound.attachments.map(async (f, i) => ({
          buffer: await readFile(f.fileId), mimeType: f.mimeType, label: `artwork-${i + 1}`,
        })))
      : [];
    const ingredients = await loadIngredients(ingredientsRound);

    const result = await reviewArtwork({
      attachments,
      artworkFromRound: artworkRound && artworkRound.number !== round.number ? artworkRound.number : null,
      ingredientsText: ingredients.text,
      ingredientsFile: ingredients.file,
      clientMessage: round.clientMessage,
      history: conversationHistory(check.rounds.slice(0, -1)),
      markets: check.markets,
      rules,
    });

    round.remarks = round.remarks.filter((r) => !(r.source === 'ai' && r.status === 'pending'));
    round.remarks.push(...result.remarks);
    round.ai = {
      status: 'done', summary: result.summary, answer: result.answer, error: '', model: result.model, ranAt: new Date(),
    };
    return result.remarks.length ? round.remarks.slice(-result.remarks.length) : [];
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      round.ai = { status: 'not_configured', summary: '', answer: '', error: '', model: '', ranAt: undefined };
    } else {
      console.error('Packaging AI review failed:', err);
      round.ai = { status: 'failed', summary: '', answer: '', error: err.message, model: '', ranAt: new Date() };
    }
    return [];
  }
};

const label = (check) => [check.client, check.product].filter(Boolean).join(' · ') || check.code;

const notifyNewRemarks = (check, remarks, actor) => {
  const sectors = [...new Set(remarks.filter((r) => r.status === 'pending').map((r) => r.sector))];
  if (!sectors.length) return Promise.resolve();
  return notifySectors(sectors, actor, {
    type: 'packaging_remarks',
    title: `Забелешки за потврда: ${check.code}`,
    message: label(check),
    link: link(check),
  });
};

// Tells Sales (the creator) once nothing is pending in the current round.
const notifyIfAllAnswered = async (check, actor) => {
  const round = currentRound(check);
  if (!round.remarks.length || round.remarks.some((r) => r.status === 'pending')) return;
  if (String(check.createdBy) === String(actor._id)) return;
  await notifyMany([check.createdBy], {
    type: 'packaging_answered',
    title: `Сите забелешки се одговорени: ${check.code}`,
    message: `${label(check)} — рунда ${round.number}`,
    link: link(check),
  });
};

const respondWithCheck = async (res, check, status = 200) => {
  await check.populate(POPULATE);
  res.status(status).json({ check, aiConfigured: isAiConfigured() });
};

// ── Checks ────────────────────────────────────────────────────────────────

export const list = async (req, res) => {
  assertTool(req.user);
  const checks = await PackagingCheck.find()
    .select('code client product markets status createdBy rounds.number rounds.remarks.sector rounds.remarks.status updatedAt createdAt')
    .populate('createdBy', USER_FIELDS)
    .sort({ updatedAt: -1 })
    .lean();

  // Lightweight list rows: progress of the current round only.
  const rows = checks.map(({ rounds, ...c }) => {
    const round = rounds[rounds.length - 1] || { remarks: [] };
    const pendingBySector = {};
    for (const r of round.remarks) {
      if (r.status === 'pending') pendingBySector[r.sector] = (pendingBySector[r.sector] || 0) + 1;
    }
    return {
      ...c,
      round: round.number || 1,
      remarksTotal: round.remarks.length,
      pendingBySector,
    };
  });
  res.json({ checks: rows, aiConfigured: isAiConfigured() });
};

export const getOne = async (req, res) => {
  assertTool(req.user);
  const check = await loadCheck(req.params.id);
  await respondWithCheck(res, check);
};

export const create = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба може да започне проверка');
  const client = (req.body.client || '').trim();
  const product = (req.body.product || '').trim();
  const markets = (req.body.markets || '').trim();
  const check = new PackagingCheck({ code: await nextCode(), client, product, markets, createdBy: req.user._id });
  check.rounds.push(await buildRound(req, 1, check._id));
  const added = await runAi(check);
  await check.save();

  await notifySectors(REVIEWER_SECTORS, req.user, {
    type: 'packaging_new',
    title: `Нова проверка на амбалажа: ${check.code}`,
    message: label(check),
    link: link(check),
  });
  await notifyNewRemarks(check, added, req.user);
  await respondWithCheck(res, check, 201);
};

export const addRound = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба може да додаде нова рунда');
  const check = await loadCheck(req.params.id);

  // Any time: each new client message starts a round; earlier rounds become history.
  check.rounds.push(await buildRound(req, check.rounds.length + 1, check._id));
  check.status = 'in_review';
  const added = await runAi(check);
  await check.save();

  await notifySectors(REVIEWER_SECTORS, req.user, {
    type: 'packaging_new',
    title: `Нова рунда (${check.rounds.length}): ${check.code}`,
    message: label(check),
    link: link(check),
  });
  await notifyNewRemarks(check, added, req.user);
  await respondWithCheck(res, check, 201);
};

export const rerunAi = async (req, res) => {
  if (!isLead(req.user) && req.user.department !== 'quality_assurance') {
    throw httpError(403, 'Немате дозвола');
  }
  if (!isAiConfigured()) throw httpError(503, 'AI не е поврзан');
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const added = await runAi(check);
  await check.save();
  await notifyNewRemarks(check, added, req.user);
  await respondWithCheck(res, check);
};

export const close = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба може да ја затвори рундата');
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const { decision, summary = '' } = req.body;
  if (!['approved', 'changes_required'].includes(decision)) throw httpError(400, 'Невалидна одлука');

  const round = currentRound(check);
  const pending = round.remarks.filter((r) => r.status === 'pending').length;
  if (pending && !isTopMgmt(req.user)) {
    throw httpError(409, `Има ${pending} неодговорени забелешки`);
  }

  round.outcome = { decision, summary: summary.trim(), by: req.user._id, at: new Date() };
  check.status = decision;
  await check.save();

  const sectors = [...new Set(round.remarks.map((r) => r.sector))].filter((s) => s !== 'sales');
  if (sectors.length) {
    await notifySectors(sectors, req.user, {
      type: 'packaging_closed',
      title: `${decision === 'approved' ? 'Одобрено' : 'Потребни корекции'}: ${check.code}`,
      message: `${label(check)} — рунда ${round.number}`,
      link: link(check),
    });
  }
  await respondWithCheck(res, check);
};

export const remove = async (req, res) => {
  const check = await loadCheck(req.params.id);
  const isCreator = String(check.createdBy) === String(req.user._id);
  if (!isTopMgmt(req.user) && !isCreator) throw httpError(403, 'Немате дозвола');

  for (const round of check.rounds) {
    for (const f of round.attachments) await deleteFile(f.fileId);
    if (round.ingredientsFile) await deleteFile(round.ingredientsFile.fileId);
  }
  await check.deleteOne();
  res.json({ message: 'Проверката е избришана' });
};

// ── Remarks (current round only) ──────────────────────────────────────────

export const addRemark = async (req, res) => {
  assertTool(req.user);
  const check = await loadCheck(req.params.id);
  assertOpen(check);

  const text = (req.body.text || '').trim();
  const { severity = 'warning', sector, ruleId } = req.body;
  if (!text) throw httpError(400, 'Внесете забелешка');
  if (!PACKAGING_SECTORS.includes(sector)) throw httpError(400, 'Изберете сектор');
  const rule = ruleId ? await PackagingRule.findById(ruleId).lean() : null;

  const round = currentRound(check);
  round.remarks.push({
    text, severity, sector,
    rule: rule?._id, ruleText: rule?.text || '',
    source: 'manual', createdBy: req.user._id,
  });
  await check.save();
  await notifyNewRemarks(check, [round.remarks[round.remarks.length - 1]], req.user);
  await respondWithCheck(res, check, 201);
};

const findRemark = (check, remarkId) => {
  const remark = currentRound(check).remarks.id(remarkId);
  if (!remark) throw httpError(404, 'Забелешката не е пронајдена');
  return remark;
};

const canManageRemark = (u, remark) =>
  isLead(u) || (remark.createdBy && String(remark.createdBy) === String(u._id));

export const updateRemark = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const remark = findRemark(check, req.params.remarkId);
  if (!canManageRemark(req.user, remark)) throw httpError(403, 'Немате дозвола');
  if (remark.status !== 'pending') throw httpError(409, 'Одговорена забелешка не може да се менува');

  const { text, severity, sector } = req.body;
  if (text !== undefined) remark.text = String(text).trim() || remark.text;
  if (severity) remark.severity = severity;
  if (sector && PACKAGING_SECTORS.includes(sector)) remark.sector = sector;
  await check.save();
  await respondWithCheck(res, check);
};

export const deleteRemark = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const remark = findRemark(check, req.params.remarkId);
  if (!canManageRemark(req.user, remark)) throw httpError(403, 'Немате дозвола');
  remark.deleteOne();
  await check.save();
  await notifyIfAllAnswered(check, req.user);
  await respondWithCheck(res, check);
};

export const respondRemark = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const remark = findRemark(check, req.params.remarkId);
  if (!canRespond(req.user, remark)) throw httpError(403, 'Само одговорниот сектор може да одговори');

  const { status, comment = '' } = req.body;
  if (!['confirmed', 'disputed', 'pending'].includes(status)) throw httpError(400, 'Невалиден одговор');
  if (status === 'disputed' && !comment.trim()) throw httpError(400, 'Објаснете зошто не е проблем');

  remark.status = status;
  remark.response = status === 'pending'
    ? { comment: '', by: undefined, at: undefined }
    : { comment: comment.trim(), by: req.user._id, at: new Date() };
  await check.save();
  await notifyIfAllAnswered(check, req.user);
  await respondWithCheck(res, check);
};

// ── Files ─────────────────────────────────────────────────────────────────

export const downloadFile = async (req, res) => {
  assertTool(req.user);
  const check = await loadCheck(req.params.id);
  const ref = check.rounds
    .flatMap((r) => [...r.attachments, r.ingredientsFile])
    .find((f) => f && String(f.fileId) === req.params.fileId);
  if (!ref) throw httpError(404, 'Датотеката не е пронајдена');

  res.setHeader('Content-Type', ref.mimeType);
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(ref.filename)}`);
  openFileStream(ref.fileId)
    .on('error', () => res.status(404).end())
    .pipe(res);
};

// ── Checklist rules ───────────────────────────────────────────────────────

export const listRules = async (req, res) => {
  assertTool(req.user);
  const rules = await PackagingRule.find().populate('createdBy', USER_FIELDS).sort({ sector: 1, category: 1, createdAt: 1 });
  res.json({ rules });
};

export const createRule = async (req, res) => {
  if (!canEditRules(req.user)) throw httpError(403, 'Само квалитет и топ менаџмент ги уредуваат правилата');
  const text = (req.body.text || '').trim();
  const { sector, category = '' } = req.body;
  if (!text) throw httpError(400, 'Внесете правило');
  if (!PACKAGING_SECTORS.includes(sector)) throw httpError(400, 'Изберете сектор');
  const rule = await PackagingRule.create({ text, sector, category: category.trim(), createdBy: req.user._id });
  await rule.populate('createdBy', USER_FIELDS);
  res.status(201).json({ rule });
};

export const updateRule = async (req, res) => {
  if (!canEditRules(req.user)) throw httpError(403, 'Само квалитет и топ менаџмент ги уредуваат правилата');
  const rule = await PackagingRule.findById(req.params.ruleId);
  if (!rule) throw httpError(404, 'Правилото не е пронајдено');
  const { text, sector, category, active } = req.body;
  if (text !== undefined && String(text).trim()) rule.text = String(text).trim();
  if (sector && PACKAGING_SECTORS.includes(sector)) rule.sector = sector;
  if (category !== undefined) rule.category = String(category).trim();
  if (active !== undefined) rule.active = Boolean(active);
  await rule.save();
  await rule.populate('createdBy', USER_FIELDS);
  res.json({ rule });
};

export const deleteRule = async (req, res) => {
  if (!canEditRules(req.user)) throw httpError(403, 'Само квалитет и топ менаџмент ги уредуваат правилата');
  await PackagingRule.findByIdAndDelete(req.params.ruleId);
  res.json({ message: 'Правилото е избришано' });
};
