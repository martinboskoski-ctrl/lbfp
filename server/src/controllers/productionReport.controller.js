import ProductionReport from '../models/ProductionReport.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isProductionOrMgmt = (u) =>
  isTopMgmt(u) || u.department === 'production' || u.isManager;

// GET /api/production-reports
export const list = async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year) filter.year = parseInt(year);

  const reports = await ProductionReport.find(filter)
    .populate('createdBy', 'name')
    .sort({ year: -1, month: -1 });

  res.json({ reports });
};

// GET /api/production-reports/:year/:month
export const getOne = async (req, res) => {
  const { year, month } = req.params;
  const report = await ProductionReport.findOne({
    year: parseInt(year),
    month: parseInt(month),
  }).populate('createdBy', 'name');

  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ report });
};

// POST /api/production-reports
export const create = async (req, res) => {
  if (!isProductionOrMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { year, month, categories, waste, workersTotal, workingDays } = req.body;
  if (!year || !month || !categories) {
    return res.status(400).json({ message: 'year, month, and categories are required' });
  }

  const existing = await ProductionReport.findOne({ year, month });
  if (existing) {
    return res.status(409).json({ message: 'Report for this month already exists' });
  }

  const report = await ProductionReport.create({
    year, month, categories, waste: waste || [],
    workersTotal: workersTotal || 0,
    workingDays: workingDays || 0,
    createdBy: req.user._id,
  });

  res.status(201).json({ report });
};

// PUT /api/production-reports/:year/:month
export const update = async (req, res) => {
  if (!isProductionOrMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const report = await ProductionReport.findOne({
    year: parseInt(req.params.year),
    month: parseInt(req.params.month),
  });
  if (!report) return res.status(404).json({ message: 'Report not found' });

  const { categories, waste, workersTotal, workingDays } = req.body;
  if (categories !== undefined) report.categories = categories;
  if (waste !== undefined) report.waste = waste;
  if (workersTotal !== undefined) report.workersTotal = workersTotal;
  if (workingDays !== undefined) report.workingDays = workingDays;

  await report.save();
  await report.populate('createdBy', 'name');
  res.json({ report });
};

// DELETE /api/production-reports/:year/:month
export const remove = async (req, res) => {
  if (!isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const report = await ProductionReport.findOneAndDelete({
    year: parseInt(req.params.year),
    month: parseInt(req.params.month),
  });
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ message: 'Report deleted' });
};

// GET /api/production-reports/summary?year=2024&view=monthly|quarterly|annual
export const summary = async (req, res) => {
  const { year, view } = req.query;
  const filter = {};
  if (year) filter.year = parseInt(year);

  const reports = await ProductionReport.find(filter).sort({ year: 1, month: 1 }).lean();

  if (view === 'annual') {
    // Group by year
    const grouped = {};
    for (const r of reports) {
      if (!grouped[r.year]) grouped[r.year] = { year: r.year, totalKg: 0, totalWasteKg: 0, reports: 0 };
      const g = grouped[r.year];
      g.reports++;
      for (const cat of r.categories) {
        for (const p of cat.products) {
          g.totalKg += p.producedKg || 0;
        }
      }
      for (const w of r.waste) {
        g.totalWasteKg += w.kg || 0;
      }
    }
    return res.json({ data: Object.values(grouped) });
  }

  if (view === 'quarterly') {
    const grouped = {};
    for (const r of reports) {
      const q = Math.ceil(r.month / 3);
      const key = `${r.year}-Q${q}`;
      if (!grouped[key]) grouped[key] = { year: r.year, quarter: q, label: key, totalKg: 0, totalWasteKg: 0 };
      const g = grouped[key];
      for (const cat of r.categories) {
        for (const p of cat.products) {
          g.totalKg += p.producedKg || 0;
        }
      }
      for (const w of r.waste) {
        g.totalWasteKg += w.kg || 0;
      }
    }
    return res.json({ data: Object.values(grouped) });
  }

  // Default: monthly
  const data = reports.map((r) => {
    let totalKg = 0;
    let totalWasteKg = 0;
    const categoryBreakdown = {};

    for (const cat of r.categories) {
      let catKg = 0;
      for (const p of cat.products) {
        catKg += p.producedKg || 0;
      }
      categoryBreakdown[cat.name] = catKg;
      totalKg += catKg;
    }
    for (const w of r.waste) {
      totalWasteKg += w.kg || 0;
    }

    return {
      year: r.year,
      month: r.month,
      label: `${r.year}-${String(r.month).padStart(2, '0')}`,
      totalKg,
      totalWasteKg,
      wastePercent: totalKg > 0 ? +((totalWasteKg / totalKg) * 100).toFixed(2) : 0,
      workersTotal: r.workersTotal,
      workingDays: r.workingDays,
      ...categoryBreakdown,
    };
  });

  res.json({ data });
};
