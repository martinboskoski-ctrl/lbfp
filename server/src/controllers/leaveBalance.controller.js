import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';

const isHRorTopMgmt = (u) => u.department === 'top_management' || u.department === 'hr';

// GET /api/leave-balances/mine
export const mine = async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ user: req.user._id, year });

  // Auto-create if doesn't exist
  if (!balance) {
    balance = await LeaveBalance.create({ user: req.user._id, year });
  }

  res.json({ balance });
};

// GET /api/leave-balances/all?year=2026
export const all = async (req, res) => {
  if (!isHRorTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const year = parseInt(req.query.year) || new Date().getFullYear();
  const balances = await LeaveBalance.find({ year })
    .populate('user', 'name department')
    .sort({ 'user.name': 1 });

  res.json({ balances });
};

// PUT /api/leave-balances/user/:userId
export const update = async (req, res) => {
  if (!isHRorTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const year = parseInt(req.body.year) || new Date().getFullYear();
  const { totalDays } = req.body;
  if (totalDays == null || totalDays < 0) {
    return res.status(400).json({ message: 'Invalid totalDays' });
  }

  const balance = await LeaveBalance.findOneAndUpdate(
    { user: req.params.userId, year },
    { totalDays },
    { new: true, upsert: true }
  ).populate('user', 'name department');

  res.json({ balance });
};

// POST /api/leave-balances/init-year
export const initYear = async (req, res) => {
  if (!isHRorTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const year = parseInt(req.body.year) || new Date().getFullYear();
  const defaultDays = parseInt(req.body.totalDays) || 20;

  const users = await User.find({}, '_id');
  const ops = users.map((u) => ({
    updateOne: {
      filter: { user: u._id, year },
      update: { $setOnInsert: { user: u._id, year, totalDays: defaultDays, usedDays: 0 } },
      upsert: true,
    },
  }));

  const result = await LeaveBalance.bulkWrite(ops);
  res.json({ message: `Initialized ${result.upsertedCount} new balances for ${year}` });
};
