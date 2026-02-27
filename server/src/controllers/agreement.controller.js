import Agreement from '../models/Agreement.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isManager = (u) => u.isManager || isTopMgmt(u);

const POPULATE = [{ path: 'createdBy', select: 'name department' }];

// GET /api/agreements?dept=sales&status=expiring_soon
export const listAgreements = async (req, res) => {
  try {
    const u = req.user;
    const { dept, status } = req.query;

    let filter = {};
    if (isTopMgmt(u)) {
      if (dept) filter.department = dept;
    } else {
      filter.department = u.department;
    }

    const agreements = await Agreement.find(filter)
      .populate(POPULATE)
      .sort({ endDate: 1, createdAt: -1 });

    let result = agreements.map((a) => a.toJSON());

    if (status) result = result.filter((a) => a.effectiveStatus === status);

    res.json({ agreements: result });
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

    const {
      title, description, otherParty, category,
      startDate, endDate, autoRenew, reminderDays,
      value, currency, status, department, notes,
    } = req.body;

    if (!title || !otherParty || !startDate) {
      return res.status(400).json({ message: 'Задолжителни полиња: наслов, друга страна, датум на почеток' });
    }

    const targetDept = isTopMgmt(u) ? (department || u.department) : u.department;

    const agreement = await Agreement.create({
      title, description, otherParty,
      category: category || 'other',
      startDate, endDate: endDate || null,
      autoRenew: autoRenew ?? false,
      reminderDays: reminderDays ?? 30,
      value: value || null,
      currency: currency || 'MKD',
      status: status || 'active',
      department: targetDept,
      createdBy: u._id,
      notes,
    });

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

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Договорот не е пронајден' });

    if (!isTopMgmt(u) && agreement.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    const allowed = [
      'title', 'description', 'otherParty', 'category',
      'startDate', 'endDate', 'autoRenew', 'reminderDays',
      'value', 'currency', 'status', 'notes',
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) agreement[key] = req.body[key] === '' ? null : req.body[key];
    });

    await agreement.save();
    await agreement.populate(POPULATE);
    res.json({ agreement: agreement.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/agreements/:id/renew  — creates new agreement, marks old one as renewed
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

    // Mark old agreement as renewed
    old.status = 'renewed';
    await old.save();

    // Create the renewal agreement
    const renewed = await Agreement.create({
      title:        old.title,
      description:  old.description,
      otherParty:   old.otherParty,
      category:     old.category,
      startDate:    startDate || new Date(),
      endDate:      endDate || null,
      autoRenew:    old.autoRenew,
      reminderDays: old.reminderDays,
      value:        old.value,
      currency:     old.currency,
      status:       'active',
      department:   old.department,
      createdBy:    u._id,
      notes:        notes || old.notes,
      renewedFromId: old._id,
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

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Договорот не е пронајден' });

    if (!isTopMgmt(u) && agreement.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    agreement.status = 'terminated';
    agreement.terminatedAt = new Date();
    agreement.terminationReason = req.body.reason || '';
    await agreement.save();
    await agreement.populate(POPULATE);
    res.json({ agreement: agreement.toJSON() });
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

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Договорот не е пронајден' });

    if (!isTopMgmt(u) && agreement.department !== u.department) {
      return res.status(403).json({ message: 'Немате пристап до овој договор' });
    }

    await agreement.deleteOne();
    res.json({ message: 'Договорот е избришан' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
