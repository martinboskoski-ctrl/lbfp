import bcrypt from 'bcryptjs';
import User, { DEPARTMENTS } from '../models/User.js';
import { logActivity, logActivityMany } from '../services/userActivity.js';

const isTopMgmt = (u) => u?.department === 'top_management';
const sameId    = (a, b) => String(a) === String(b);

const guard = (req, res) => {
  if (!isTopMgmt(req.user)) {
    res.status(403).json({ message: 'Top management only' });
    return false;
  }
  return true;
};

const reqIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

// ── List ──────────────────────────────────────────────────────────────────────
// Excludes deleted users by default; pass ?includeDeleted=1 to see them.
export const listUsers = async (req, res) => {
  if (!guard(req, res)) return;
  const filter = req.query.includeDeleted === '1' ? {} : { status: { $ne: 'deleted' } };
  const users = await User.find(filter)
    .select('-passwordHash -activityLog')
    .populate('manager', 'name department')
    .sort({ name: 1 });
  res.json({ users });
};

// ── Get one (full, with activity log tail) ───────────────────────────────────
export const getUser = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id)
    .select('-passwordHash')
    .populate('manager',     'name department')
    .populate('suspendedBy', 'name')
    .populate('deletedBy',   'name');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

// ── Update profile fields ─────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, department, isManager, role, manager, language } = req.body;

  // Self-protection: cannot demote yourself out of top management.
  if (sameId(user._id, req.user._id) && department && department !== 'top_management') {
    return res.status(400).json({ message: 'You cannot demote yourself out of top management' });
  }

  const changes = {};
  if (name        !== undefined && name.trim()) { user.name = name.trim(); changes.name = user.name; }
  if (department  !== undefined) {
    if (!DEPARTMENTS.includes(department)) return res.status(400).json({ message: 'Invalid department' });
    user.department = department;
    changes.department = department;
  }
  if (isManager   !== undefined) { user.isManager = !!isManager; changes.isManager = user.isManager; }
  if (role        !== undefined) {
    if (!['owner', 'reviewer', 'client', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    user.role = role;
    changes.role = role;
  }
  if (language    !== undefined) {
    if (!['mk', 'en'].includes(language)) return res.status(400).json({ message: 'Invalid language' });
    user.language = language;
  }
  if (manager !== undefined) {
    user.manager = manager || null;
    changes.manager = manager || null;
  }

  await user.save();

  // Log on the actor; also leave a trail on the target.
  await logActivityMany([req.user._id, user._id], 'admin.update_user', {
    target: `User:${user._id}`, targetType: 'User',
    metadata: { changes, by: String(req.user._id), targetName: user.name },
    ip: reqIp(req),
  });

  await user.populate('manager', 'name department');
  res.json({ user: user.toSafeObject() });
};

// ── Suspend ───────────────────────────────────────────────────────────────────
export const suspendUser = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (sameId(user._id, req.user._id)) {
    return res.status(400).json({ message: 'You cannot suspend yourself' });
  }
  if (user.status === 'deleted') {
    return res.status(400).json({ message: 'User is deleted' });
  }

  user.status          = 'suspended';
  user.active          = false;
  user.suspendedAt     = new Date();
  user.suspendedBy     = req.user._id;
  user.suspendedReason = (req.body?.reason || '').toString().slice(0, 500);
  await user.save();

  await logActivityMany([req.user._id, user._id], 'admin.suspend_user', {
    target: `User:${user._id}`, targetType: 'User',
    metadata: { reason: user.suspendedReason, targetName: user.name, by: String(req.user._id) },
    ip: reqIp(req),
  });

  res.json({ user: user.toSafeObject() });
};

// ── Reactivate ────────────────────────────────────────────────────────────────
export const reactivateUser = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.status === 'deleted') {
    return res.status(400).json({ message: 'Deleted users cannot be reactivated' });
  }

  user.status          = 'active';
  user.active          = true;
  user.suspendedAt     = null;
  user.suspendedBy     = null;
  user.suspendedReason = '';
  await user.save();

  await logActivityMany([req.user._id, user._id], 'admin.reactivate_user', {
    target: `User:${user._id}`, targetType: 'User',
    metadata: { targetName: user.name, by: String(req.user._id) },
    ip: reqIp(req),
  });

  res.json({ user: user.toSafeObject() });
};

// ── Soft delete ───────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (sameId(user._id, req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }

  user.status    = 'deleted';
  user.active    = false;
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;
  await user.save();

  await logActivityMany([req.user._id, user._id], 'admin.delete_user', {
    target: `User:${user._id}`, targetType: 'User',
    metadata: { targetName: user.name, by: String(req.user._id) },
    ip: reqIp(req),
  });

  res.json({ user: user.toSafeObject() });
};

// ── Reset password (returns one-time temp password) ──────────────────────────
export const resetPassword = async (req, res) => {
  if (!guard(req, res)) return;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Generate a 12-char temp password with letters + digits.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let temp = '';
  for (let i = 0; i < 12; i++) temp += alphabet[Math.floor(Math.random() * alphabet.length)];

  user.passwordHash = await bcrypt.hash(temp, 12);
  await user.save();

  await logActivityMany([req.user._id, user._id], 'admin.reset_password', {
    target: `User:${user._id}`, targetType: 'User',
    metadata: { targetName: user.name, by: String(req.user._id) },
    ip: reqIp(req),
  });

  // Returned once to top mgmt; they're expected to communicate it to the user out-of-band.
  res.json({ user: user.toSafeObject(), tempPassword: temp });
};
