import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';

export const listUsers = async (req, res) => {
  const users = await User.find().select('-passwordHash');
  res.json({ users });
};

// Returns name + dept info for all users (or filtered by ?dept=)
export const listDirectory = async (req, res) => {
  const filter = req.query.dept ? { department: req.query.dept } : {};
  const users = await User.find(filter).select('name department isManager');
  res.json({ users });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(422).json({ message: 'New password must be at least 8 characters with a letter and digit' });
  }

  const valid = await req.user.comparePassword(currentPassword);
  if (!valid) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }

  req.user.passwordHash = await bcrypt.hash(newPassword, 12);
  await req.user.save();
  res.json({ message: 'Password changed' });
};

export const updateLanguage = async (req, res) => {
  const { language } = req.body;
  if (!['mk', 'en'].includes(language)) {
    return res.status(400).json({ message: 'Language must be "mk" or "en"' });
  }
  req.user.language = language;
  await req.user.save();
  res.json({ user: req.user.toSafeObject() });
};

export const inviteUser = async (req, res) => {
  const { email, name, role, companyId } = req.body;

  if (!email || !name || !role || !companyId) {
    return res.status(400).json({ message: 'email, name, role, and companyId are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ message: 'Company not found' });

  // Stub: generate a temporary password (in production, send invite email)
  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({ email, passwordHash, name, role, company: companyId });

  // In production, send email with tempPassword
  res.status(201).json({
    user: user.toSafeObject(),
    tempPassword, // Remove in production — send via email
  });
};
