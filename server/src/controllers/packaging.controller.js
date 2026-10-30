import PackagingCheck, { PACKAGING_SECTORS, EMAIL_SECTION_KEYS } from '../models/PackagingCheck.js';
import PackagingRule from '../models/PackagingRule.js';
import User from '../models/User.js';
import { saveFile, openFileStream, readFile, deleteFile } from '../services/packagingFiles.js';
import { reviewArtwork, isAiConfigured, docxToText, AiNotConfiguredError } from '../services/packagingAi.js';
import { buildEmailText, defaultOpening, defaultClosing } from '../services/packagingEmail.js';
import { notifyMany } from '../services/notification.js';

const isTopMgmt = (u) => u.department === 'top_management';
const inTool = (u) => isTopMgmt(u) || PACKAGING_SECTORS.includes(u.department);
const isLead = (u) => isTopMgmt(u) || u.department === 'sales';
const canEditRules = (u) => isTopMgmt(u) || u.department === 'quality_assurance';
const ownsSection = (u, section) => isTopMgmt(u) || u.department === section.sector;

const REVIEWER_SECTORS = PACKAGING_SECTORS.filter((s) => s !== 'sales');
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const USER_FIELDS = 'name department';
const POPULATE = [
  { path: 'createdBy', select: USER_FIELDS },
  { path: 'rounds.createdBy', select: USER_FIELDS },
  { path: 'rounds.email.sections.approval.by', select: USER_FIELDS },
  { path: 'rounds.email.sections.comments.by', select: USER_FIELDS },
  { path: 'rounds.email.sent.by', select: USER_FIELDS },
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

// Earlier rounds as plain text, so the AI can follow the conversation. A sent
// email is quoted as sent; otherwise the draft paragraphs.
const conversationHistory = (rounds) => rounds.map((r) => {
  const parts = [`Round ${r.number}:`];
  if (r.clientMessage) parts.push(`Client wrote: ${r.clientMessage}`);
  parts.push(r.attachments?.length ? `Client sent ${r.attachments.length} artwork file(s).` : 'No artwork in this round.');
  if (r.email.sent?.text) {
    parts.push('Our email to the client:', r.email.sent.text);
  } else {
    const items = r.email.sections.flatMap((sec) => sec.items.map((i) => `- ${i}`));
    if (items.length) parts.push('Points in our draft (not sent):', ...items);
    if (r.ai?.answer) parts.push(`Our draft answer: ${r.ai.answer}`);
  }
  if (r.outcome?.decision) parts.push(`Round closed: ${DECISION_TEXT[r.outcome.decision]}.`);
  return parts.join('\n');
}).join('\n\n');

// Runs the AI on the check's current round, using the latest artwork and ingredient
// list given anywhere in the conversation. Paragraphs a person edited or approved
// are kept. Returns the sectors whose paragraphs it (re)wrote with remarks.
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

    const written = [];
    for (const section of round.email.sections) {
      if (section.edited || section.approval?.at) continue;
      section.items = result.sections[section.key] || [];
      if (section.items.length) written.push(section.sector);
    }
    round.ai = {
      status: 'done', summary: result.summary, answer: result.answer, error: '', model: result.model, ranAt: new Date(),
    };
    return [...new Set(written)];
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

const notifyDraft = (check, sectors, actor) => {
  if (!sectors.length) return Promise.resolve();
  return notifySectors(sectors, actor, {
    type: 'packaging_draft',
    title: `Забелешки за преглед и одобрување: ${check.code}`,
    message: label(check),
    link: link(check),
  });
};

const unapprovedSectors = (round) =>
  [...new Set(round.email.sections.filter((s) => !s.approval?.at).map((s) => s.sector))];

// Tells Sales (the creator) once every paragraph of the current round is approved.
const notifyIfAllApproved = async (check, actor) => {
  const round = currentRound(check);
  if (unapprovedSectors(round).length) return;
  if (String(check.createdBy) === String(actor._id)) return;
  await notifyMany([check.createdBy], {
    type: 'packaging_approved',
    title: `Сите сектори одобрија: ${check.code}`,
    message: `${label(check)} — рунда ${round.number}`,
    link: link(check),
  });
};

// Each round also carries the email as the client would get it, plus the effective
// opening / closing (generated when Sales has not written their own).
const respondWithCheck = async (res, check, status = 200) => {
  await check.populate(POPULATE);
  const json = check.toJSON();
  json.rounds = json.rounds.map((r, i) => {
    const round = check.rounds[i];
    return {
      ...r,
      emailPreview: {
        text: round.email.sent?.text || buildEmailText(check, round, check.createdBy?.name),
        opening: round.email.opening || defaultOpening(check, round),
        closing: round.email.closing || defaultClosing(round),
      },
    };
  });
  res.status(status).json({ check: json, aiConfigured: isAiConfigured() });
};

// ── Checks ────────────────────────────────────────────────────────────────

export const list = async (req, res) => {
  assertTool(req.user);
  const checks = await PackagingCheck.find()
    .select('code client product markets status createdBy rounds.number rounds.email.sections updatedAt createdAt')
    .populate('createdBy', USER_FIELDS)
    .sort({ updatedAt: -1 })
    .lean();

  // Lightweight list rows: progress of the current round only — paragraphs not yet approved per sector.
  const rows = checks.map(({ rounds, ...c }) => {
    const round = rounds[rounds.length - 1];
    const sections = round?.email?.sections || [];
    const pendingBySector = {};
    for (const sec of sections) {
      if (!sec.approval?.at) pendingBySector[sec.sector] = (pendingBySector[sec.sector] || 0) + 1;
    }
    return {
      ...c,
      round: round?.number || 1,
      remarksTotal: sections.reduce((n, sec) => n + sec.items.length, 0),
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
  const written = await runAi(check);
  await check.save();

  // Sectors with AI remarks get the "please review" notice; the rest just hear about the new check.
  await notifyDraft(check, written, req.user);
  await notifySectors(REVIEWER_SECTORS.filter((s) => !written.includes(s)), req.user, {
    type: 'packaging_new',
    title: `Нова проверка на амбалажа: ${check.code}`,
    message: label(check),
    link: link(check),
  });
  await respondWithCheck(res, check, 201);
};

export const addRound = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба може да додаде нова рунда');
  const check = await loadCheck(req.params.id);

  // Any time: each new client message starts a round; earlier rounds become history.
  check.rounds.push(await buildRound(req, check.rounds.length + 1, check._id));
  check.status = 'in_review';
  const written = await runAi(check);
  await check.save();

  await notifyDraft(check, written, req.user);
  await notifySectors(REVIEWER_SECTORS.filter((s) => !written.includes(s)), req.user, {
    type: 'packaging_new',
    title: `Нова рунда (${check.rounds.length}): ${check.code}`,
    message: label(check),
    link: link(check),
  });
  await respondWithCheck(res, check, 201);
};

export const rerunAi = async (req, res) => {
  if (!isLead(req.user) && req.user.department !== 'quality_assurance') {
    throw httpError(403, 'Немате дозвола');
  }
  if (!isAiConfigured()) throw httpError(503, 'AI не е поврзан');
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const written = await runAi(check);
  await check.save();
  await notifyDraft(check, written, req.user);
  await respondWithCheck(res, check);
};

// Sales sends the email: every paragraph must be approved (top management may
// override). The text as sent is kept for the record and for the next AI round.
export const close = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба ја испраќа е-поштата');
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const { decision } = req.body;
  if (!['approved', 'changes_required'].includes(decision)) throw httpError(400, 'Невалидна одлука');

  const round = currentRound(check);
  const waiting = unapprovedSectors(round);
  if (waiting.length && !isTopMgmt(req.user)) {
    throw httpError(409, 'Сите сектори треба да ги одобрат своите забелешки');
  }

  await check.populate({ path: 'createdBy', select: USER_FIELDS });
  round.email.sent = { text: buildEmailText(check, round, check.createdBy?.name), by: req.user._id, at: new Date() };
  round.outcome = { decision, summary: '', by: req.user._id, at: new Date() };
  check.status = decision;
  await check.save();

  await notifySectors(REVIEWER_SECTORS, req.user, {
    type: 'packaging_closed',
    title: `${decision === 'approved' ? 'Одобрено' : 'Испратени корекции'}: ${check.code}`,
    message: `${label(check)} — рунда ${round.number}`,
    link: link(check),
  });
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

// ── Email draft (current round only) ──────────────────────────────────────

export const updateEmail = async (req, res) => {
  if (!isLead(req.user)) throw httpError(403, 'Само продажба ги уредува воведот и заклучокот');
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const { email } = currentRound(check);
  // Empty text → back to the generated opening / closing.
  for (const field of ['opening', 'closing']) {
    if (req.body[field] !== undefined) email[field] = String(req.body[field]).trim();
  }
  await check.save();
  await respondWithCheck(res, check);
};

const findSection = (check, key) => {
  if (!EMAIL_SECTION_KEYS.includes(key)) throw httpError(404, 'Непознат дел');
  return currentRound(check).email.sections.find((s) => s.key === key);
};

const assertOwner = (u, section) => {
  if (!ownsSection(u, section)) throw httpError(403, 'Само одговорниот сектор го уредува овој дел');
};

// Any change clears the approval: the owner approves the paragraph as it now reads.
export const updateSection = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const section = findSection(check, req.params.key);
  assertOwner(req.user, section);
  if (!Array.isArray(req.body.items)) throw httpError(400, 'Невалидни забелешки');

  section.items = req.body.items.map((i) => String(i).trim()).filter(Boolean);
  section.edited = true;
  section.approval = { by: undefined, at: undefined };
  await check.save();
  await respondWithCheck(res, check);
};

export const approveSection = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const section = findSection(check, req.params.key);
  assertOwner(req.user, section);

  section.approval = req.body.approved === false
    ? { by: undefined, at: undefined }
    : { by: req.user._id, at: new Date() };
  await check.save();
  if (section.approval.at) await notifyIfAllApproved(check, req.user);
  await respondWithCheck(res, check);
};

// Anyone in the tool can comment or suggest a change; the owner and Sales are told.
export const addComment = async (req, res) => {
  assertTool(req.user);
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const section = findSection(check, req.params.key);
  const text = (req.body.text || '').trim();
  if (!text) throw httpError(400, 'Внесете коментар');

  section.comments.push({ text, by: req.user._id });
  await check.save();

  const users = await User.find({
    $or: [{ department: section.sector }, { _id: check.createdBy }],
    _id: { $ne: req.user._id },
  }).select('_id');
  if (users.length) {
    await notifyMany(users.map((u) => u._id), {
      type: 'packaging_comment',
      title: `Нов коментар: ${check.code}`,
      message: `${req.user.name}: ${text.slice(0, 120)}`,
      link: link(check),
    });
  }
  await respondWithCheck(res, check, 201);
};

export const deleteComment = async (req, res) => {
  const check = await loadCheck(req.params.id);
  assertOpen(check);
  const section = findSection(check, req.params.key);
  const comment = section.comments.id(req.params.commentId);
  if (!comment) throw httpError(404, 'Коментарот не е пронајден');
  if (!isTopMgmt(req.user) && String(comment.by) !== String(req.user._id)) throw httpError(403, 'Немате дозвола');
  comment.deleteOne();
  await check.save();
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
