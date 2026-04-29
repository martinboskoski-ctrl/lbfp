import { v4 as uuidv4 } from 'uuid';
import Agreement from '../models/Agreement.js';
import Notification from '../models/Notification.js';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '../services/s3.js';
import { emitToUser } from '../config/socket.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isManager = (u) => u.isManager || isTopMgmt(u);
const isHRAdmin = (u) => isTopMgmt(u) || (u.department === 'hr' && u.isManager);

const POPULATE = [
  { path: 'createdBy', select: 'name department' },
  { path: 'owner',     select: 'name department isManager' },
];

// Apply confidentiality projection: confidential agreements are visible only
// to the owner, the dept manager, HR managers, or top management.
const canSeeAgreement = (agreement, viewer) => {
  if (isTopMgmt(viewer)) return true;
  if (agreement.department !== viewer.department) return false;
  if (agreement.confidentiality === 'confidential') {
    if (viewer.isManager) return true;
    if (isHRAdmin(viewer)) return true;
    if (agreement.owner && String(agreement.owner._id || agreement.owner) === String(viewer._id)) return true;
    return false;
  }
  return true;
};

const ALLOWED_FIELDS = [
  'contractNumber', 'title', 'description', 'category', 'tags',
  'otherParty', 'counterpartyContact',
  'startDate', 'endDate', 'signedDate',
  'autoRenew', 'autoRenewMonths', 'reminderDays', 'terminationNoticeDays',
  'value', 'currency', 'paymentTerms', 'paymentAmount',
  'riskLevel', 'confidentiality', 'owner',
  'status', 'notes',
];

const stripEmpty = (val) => (val === '' ? null : val);

// ─────────────────────────────────────────────────────────────────────────────

// GET /api/agreements?dept=sales&status=expiring_soon&q=foo&category=lease
export const listAgreements = async (req, res) => {
  try {
    const u = req.user;
    const { dept, status, category, riskLevel, q } = req.query;

    const filter = {};
    if (isTopMgmt(u)) {
      if (dept) filter.department = dept;
    } else {
      filter.department = u.department;
    }
    if (category)  filter.category = category;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: re }, { otherParty: re }, { contractNumber: re }];
    }

    const agreements = await Agreement.find(filter)
      .populate(POPULATE)
      .sort({ endDate: 1, createdAt: -1 });

    let result = agreements
      .filter((a) => canSeeAgreement(a, u))
      .map((a) => a.toJSON());

    if (status) result = result.filter((a) => a.effectiveStatus === status);

    res.json({ agreements: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/agreements/:id
export const getAgreement = async (req, res) => {
  try {
    const a = await Agreement.findById(req.params.id)
      .populate(POPULATE)
      .populate({ path: 'activityLog.user', select: 'name department' });
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!canSeeAgreement(a, req.user)) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }
    res.json({ agreement: a.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/agreements
export const createAgreement = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да додаваат договори' });
    }

    const body = { ...req.body };
    if (!body.title || !body.otherParty || !body.startDate) {
      return res.status(400).json({ message: 'Задолжителни полиња: наслов, друга страна, датум на почеток' });
    }

    const targetDept = isTopMgmt(u) ? (body.department || u.department) : u.department;

    const data = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) data[key] = stripEmpty(body[key]);
    }
    data.department = targetDept;
    data.createdBy  = u._id;
    data.activityLog = [{ user: u._id, action: 'created', text: '' }];

    const agreement = await Agreement.create(data);
    await agreement.populate(POPULATE);
    res.status(201).json({ agreement: agreement.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/agreements/:id
export const updateAgreement = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да уредуваат договори' });
    }

    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const changed = [];
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) {
        a[key] = stripEmpty(req.body[key]);
        changed.push(key);
      }
    }
    if (changed.length) {
      a.activityLog.push({ user: u._id, action: 'updated', text: '', meta: { fields: changed } });
    }

    await a.save();
    await a.populate(POPULATE);
    res.json({ agreement: a.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/agreements/:id/renew
export const renewAgreement = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да обновуваат договори' });
    }

    const old = await Agreement.findById(req.params.id);
    if (!old) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && old.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const { startDate, endDate, notes } = req.body;

    old.status = 'renewed';
    old.activityLog.push({ user: u._id, action: 'renewed', text: notes || '' });
    await old.save();

    const renewed = await Agreement.create({
      contractNumber:        old.contractNumber,
      title:                 old.title,
      description:           old.description,
      otherParty:            old.otherParty,
      counterpartyContact:   old.counterpartyContact,
      category:              old.category,
      tags:                  old.tags,
      startDate:             startDate || new Date(),
      endDate:               endDate || null,
      signedDate:            null,
      autoRenew:             old.autoRenew,
      autoRenewMonths:       old.autoRenewMonths,
      reminderDays:          old.reminderDays,
      terminationNoticeDays: old.terminationNoticeDays,
      value:                 old.value,
      currency:              old.currency,
      paymentTerms:          old.paymentTerms,
      paymentAmount:         old.paymentAmount,
      riskLevel:             old.riskLevel,
      confidentiality:       old.confidentiality,
      owner:                 old.owner,
      status:                'active',
      department:            old.department,
      createdBy:             u._id,
      notes:                 notes || old.notes,
      renewedFromId:         old._id,
      activityLog:           [{ user: u._id, action: 'created', text: 'Обновен од претходен договор', meta: { renewedFromId: old._id } }],
    });

    await renewed.populate(POPULATE);
    res.status(201).json({ agreement: renewed.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/agreements/:id/terminate
export const terminateAgreement = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да раскинуваат договори' });
    }

    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    a.status = 'terminated';
    a.terminatedAt = new Date();
    a.terminationReason = req.body.reason || '';
    a.activityLog.push({ user: u._id, action: 'terminated', text: a.terminationReason });
    await a.save();
    await a.populate(POPULATE);
    res.json({ agreement: a.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/agreements/:id
export const deleteAgreement = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да бришат договори' });
    }

    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    await a.deleteOne();
    res.json({ message: 'Договорот е избришан' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Activity log ────────────────────────────────────────────────────────────

// POST /api/agreements/:id/notes  { text }
export const addNote = async (req, res) => {
  try {
    const u = req.user;
    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!canSeeAgreement(a, u)) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Празна белешка' });

    a.activityLog.push({ user: u._id, action: 'note', text });
    await a.save();
    await a.populate(POPULATE);
    await a.populate({ path: 'activityLog.user', select: 'name department' });
    res.json({ agreement: a.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Files (S3 presigned upload, mirroring file.controller.js) ───────────────

// POST /api/agreements/:id/files/initiate  { originalName, contentType, label? }
export const initiateFileUpload = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да прикачуваат документи' });
    }

    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const { originalName, contentType, label } = req.body;
    if (!originalName || !contentType) {
      return res.status(400).json({ message: 'originalName и contentType се задолжителни' });
    }

    const ext = originalName.split('.').pop();
    const key = `agreements/${a._id}/${uuidv4()}.${ext}`;

    const uploadUrl = await getPresignedUploadUrl({ key, contentType });

    a.files.push({
      key,
      name: originalName,
      mimeType: contentType,
      label: label || '',
      uploadedBy: u._id,
    });
    a.activityLog.push({ user: u._id, action: 'file_added', text: originalName });
    await a.save();

    const newFile = a.files[a.files.length - 1];
    res.status(201).json({ file: newFile, uploadUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/agreements/:id/files/:fileId/confirm  { size }
export const confirmFileUpload = async (req, res) => {
  try {
    const u = req.user;
    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const file = a.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'Документот не е пронајден' });
    if (req.body.size !== undefined) file.size = req.body.size;
    await a.save();
    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/agreements/:id/files/:fileId/url
export const getFileDownloadUrl = async (req, res) => {
  try {
    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!canSeeAgreement(a, req.user)) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const file = a.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'Документот не е пронајден' });

    const url = await getPresignedDownloadUrl({ key: file.key });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/agreements/:id/files/:fileId
export const deleteFile = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да бришат документи' });
    }

    const a = await Agreement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Договорот не е пронајден' });
    if (!isTopMgmt(u) && a.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const file = a.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'Документот не е пронајден' });

    a.activityLog.push({ user: u._id, action: 'file_removed', text: file.name });
    file.deleteOne();
    await a.save();
    res.json({ message: 'Документот е избришан' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Reminder dispatch (called by scheduler / can be triggered manually) ─────

const REMINDER_THRESHOLDS = [60, 30, 14, 7, 1];

export const dispatchReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const agreements = await Agreement.find({
    endDate: { $ne: null },
    status: { $in: ['active', 'draft'] },
  }).populate(POPULATE);

  let dispatched = 0;

  for (const a of agreements) {
    const days = Math.ceil((new Date(a.endDate) - today) / 86_400_000);
    // Match the smallest threshold the agreement is currently inside.
    const threshold = REMINDER_THRESHOLDS.find((t) => days >= 0 && days <= t && t <= a.reminderDays);
    if (threshold == null) continue;
    if (a.lastReminderDayOffset === threshold) continue; // already fired for this threshold

    // Recipients: dept managers + owner + top mgmt (one notification each)
    const User = (await import('../models/User.js')).default;
    const recipients = await User.find({
      $or: [
        { department: a.department, isManager: true },
        { department: 'top_management' },
        ...(a.owner ? [{ _id: a.owner._id || a.owner }] : []),
      ],
    }).select('_id').lean();

    const seen = new Set();
    for (const r of recipients) {
      const key = String(r._id);
      if (seen.has(key)) continue;
      seen.add(key);
      const notif = await Notification.create({
        recipient: r._id,
        type: 'agreement_reminder',
        title: `Договорот „${a.title}" истекува за ${days} ${days === 1 ? 'ден' : 'денови'}`,
        message: `Договор со ${a.otherParty}. Категорија: ${a.category}. Праг: ${threshold}д.`,
        link: `/agreements/${a._id}`,
        metadata: { agreementId: a._id, threshold, daysLeft: days },
      });
      try { emitToUser(String(r._id), 'notification:new', notif); } catch { /* socket optional */ }
    }

    a.lastReminderSentAt = new Date();
    a.lastReminderDayOffset = threshold;
    a.activityLog.push({
      user: a.createdBy,
      action: 'reminder_sent',
      text: `Праг ${threshold} денови — известени ${seen.size} корисници`,
      meta: { threshold, daysLeft: days, count: seen.size },
    });
    await a.save();
    dispatched += seen.size;
  }
  return dispatched;
};

// POST /api/agreements/dispatch-reminders  (manual trigger — top mgmt only)
export const triggerReminders = async (req, res) => {
  try {
    if (!isTopMgmt(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const count = await dispatchReminders();
    res.json({ dispatched: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
