import Lead from '../models/Lead.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isSales   = (u) => u.department === 'sales';
const isManager = (u) => u.isManager || isTopMgmt(u);
const hasAccess = (u) => isSales(u) || isTopMgmt(u);

const POPULATE = [
  { path: 'assignedTo', select: 'name department' },
  { path: 'createdBy',  select: 'name department' },
  { path: 'activities.createdBy', select: 'name' },
];

// GET /api/leads
export const listLeads = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const leads = await Lead.find({ department: 'sales' })
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    res.json({ leads: leads.map((l) => l.toJSON()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/leads
export const createLead = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const {
      contactName, companyName, email, phone,
      stage, source, priority,
      estimatedValue, currency, productInterest,
      nextFollowUp, assignedTo,
    } = req.body;

    if (!contactName || !companyName) {
      return res.status(400).json({ message: 'Задолжителни полиња: контакт лице, компанија' });
    }

    // Non-managers can only assign to themselves
    const owner = isManager(u) ? (assignedTo || u._id) : u._id;

    const lead = await Lead.create({
      contactName, companyName,
      email: email || '',
      phone: phone || '',
      stage: stage || 'new',
      source: source || 'other',
      priority: priority || 'medium',
      estimatedValue: estimatedValue || null,
      currency: currency || 'EUR',
      productInterest: productInterest || '',
      nextFollowUp: nextFollowUp || null,
      assignedTo: owner,
      department: 'sales',
      createdBy: u._id,
    });

    await lead.populate(POPULATE);
    res.status(201).json({ lead: lead.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id
export const updateLead = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Лидот не е пронајден' });

    // Non-managers can only edit their own leads
    if (!isManager(u) && lead.assignedTo.toString() !== u._id.toString()) {
      return res.status(403).json({ message: 'Можете да уредувате само свои лидови' });
    }

    const oldStage = lead.stage;

    const allowed = [
      'contactName', 'companyName', 'email', 'phone',
      'stage', 'source', 'priority',
      'estimatedValue', 'currency', 'productInterest',
      'nextFollowUp', 'lostReason',
    ];
    // Only managers can reassign
    if (isManager(u)) allowed.push('assignedTo');

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) lead[key] = req.body[key] === '' ? null : req.body[key];
    });

    // Auto-set dates on stage transitions
    if (lead.stage === 'won' && oldStage !== 'won') {
      lead.wonDate = new Date();
      lead.lostDate = null;
    } else if (lead.stage === 'lost' && oldStage !== 'lost') {
      lead.lostDate = new Date();
      lead.wonDate = null;
    } else if (oldStage === 'won' || oldStage === 'lost') {
      // Reopening — clear dates
      if (lead.stage !== 'won') lead.wonDate = null;
      if (lead.stage !== 'lost') lead.lostDate = null;
    }

    await lead.save();
    await lead.populate(POPULATE);
    res.json({ lead: lead.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/leads/:id/activities
export const addActivity = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Лидот не е пронајден' });

    const { type, text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Текстот е задолжителен' });
    }

    lead.activities.push({ type: type || 'note', text: text.trim(), createdBy: u._id });
    await lead.save();
    await lead.populate(POPULATE);
    res.json({ lead: lead.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да бришат лидови' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Лидот не е пронајден' });

    await lead.deleteOne();
    res.json({ message: 'Лидот е избришан' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
