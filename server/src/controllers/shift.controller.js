import ShiftSchedule from '../models/ShiftSchedule.js';
import User from '../models/User.js';

const isTopMgmt = (u) => u.department === 'top_management';

const SHIFT_TIMES = {
  morning:   { startTime: '06:00', endTime: '14:00' },
  afternoon: { startTime: '14:00', endTime: '22:00' },
  night:     { startTime: '22:00', endTime: '06:00' },
};

// GET /api/shifts
export const list = async (req, res) => {
  const { week, department } = req.query;
  const filter = {};

  // Access control
  if (isTopMgmt(req.user)) {
    // sees all — optionally filter by department
    if (department) filter.department = department;
  } else if (req.user.isManager) {
    // managers see their own department
    filter.department = req.user.department;
  } else {
    // employees see only their own shifts
    filter.employee = req.user._id;
  }

  // Week filter: date >= week start, date < week start + 7 days
  if (week) {
    const start = new Date(week);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    filter.date = { $gte: start, $lt: end };
  }

  const shifts = await ShiftSchedule.find(filter)
    .populate('employee', 'name department')
    .sort({ date: 1, startTime: 1 });

  res.json({ shifts });
};

// POST /api/shifts
export const create = async (req, res) => {
  if (!req.user.isManager && !isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Only managers can create shifts' });
  }

  const raw = req.body.shifts || req.body;
  const items = Array.isArray(raw) ? raw : [raw];

  // Resolve department from employee if not provided
  for (const item of items) {
    if (!item.department) {
      const emp = await User.findById(item.employee).lean();
      if (!emp) return res.status(400).json({ message: `Employee ${item.employee} not found` });
      item.department = emp.department;
    }

    const existing = await ShiftSchedule.findOne({ employee: item.employee, date: item.date });
    if (existing) {
      return res.status(409).json({
        message: `Employee ${item.employee} already has a shift on ${item.date}`,
      });
    }
  }

  const shifts = await ShiftSchedule.insertMany(
    items.map((item) => ({
      ...SHIFT_TIMES[item.shiftType],
      ...item,
      createdBy: req.user._id,
    })),
  );

  res.status(201).json({ shifts });
};

// PUT /api/shifts/:id
export const update = async (req, res) => {
  if (!req.user.isManager && !isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Only managers can update shifts' });
  }

  const shift = await ShiftSchedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('employee', 'name department');

  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  res.json({ shift });
};

// DELETE /api/shifts/:id
export const remove = async (req, res) => {
  if (!req.user.isManager && !isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Only managers can delete shifts' });
  }

  const shift = await ShiftSchedule.findByIdAndDelete(req.params.id);
  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  res.json({ message: 'Shift deleted' });
};
