import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password must be ≥8 chars and contain at least one letter and one digit
const isStrongEnough = (pw) =>
  pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const register = async (req, res) => {
  const {
    email: rawEmail, password, name: rawName,
    department, isManager,
  } = req.body;

  const email = rawEmail?.toLowerCase().trim();
  const name  = rawName?.trim();

  // ── Validation ────────────────────────────────────────────────────────
  const errors = {};
  if (!name || name.length < 2)          errors.name       = 'Името мора да содржи најмалку 2 знаци';
  if (!email || !EMAIL_RE.test(email))   errors.email      = 'Невалидна е-пошта адреса';
  if (!password || !isStrongEnough(password))
    errors.password = 'Лозинката мора да содржи најмалку 8 знаци, буква и цифра';
  if (!department || !DEPARTMENTS.includes(department))
    errors.department = 'Изберете валидно одделение';

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Невалидни податоци', errors });
  }

  // ── Duplicate check ───────────────────────────────────────────────────
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Оваа е-пошта е веќе регистрирана' });
  }

  // ── Create ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  const manager = isManager === true || isManager === 'true';

  const user = await User.create({
    email, passwordHash, name, department,
    isManager: manager,
    role: manager ? 'owner' : 'reviewer',
  });

  const token = signToken(user._id);
  res.status(201).json({ token, user: user.toSafeObject() });
};

export const login = async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail?.toLowerCase().trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Е-поштата и лозинката се задолжителни' });
  }

  // Generic message — never reveal which field is wrong
  const INVALID = 'Невалидна е-пошта или лозинка';

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: INVALID });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ message: INVALID });

  const token = signToken(user._id);
  res.json({ token, user: user.toSafeObject() });
};

export const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};
