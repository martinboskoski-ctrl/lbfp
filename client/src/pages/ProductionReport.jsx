import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import {
  useProductionReport, useProductionSummary,
  useCreateProductionReport, useUpdateProductionReport,
} from '../hooks/useProductionReports.js';
import { ChevronLeft, ChevronRight, Plus, Save, BarChart3, Table } from 'lucide-react';

// ─── Default product structure matching the spreadsheet ─────────────
const DEFAULT_CATEGORIES = [
  {
    name: 'Hansela',
    products: [
      { name: 'SW / USA (0.028)',    kgPerPiece: 0.028, capacityShift: 900,  producedKg: 0 },
      { name: 'SW / USA (0.04)',     kgPerPiece: 0.04,  capacityShift: 2300, producedKg: 0 },
      { name: 'SW / USA (0.05)',     kgPerPiece: 0.05,  capacityShift: 1950, producedKg: 0 },
      { name: 'Israel',              kgPerPiece: 0.065, capacityShift: 1950, producedKg: 0 },
      { name: '(0.04)',              kgPerPiece: 0.04,  capacityShift: 120,  producedKg: 0 },
      { name: 'Minis',               kgPerPiece: 0.02,  capacityShift: 120,  producedKg: 0 },
    ],
  },
  {
    name: 'OLD&Extruder',
    products: [
      { name: 'OATLOWS',       kgPerPiece: 0.06,  capacityShift: 600, producedKg: 0 },
      { name: 'Oat bar',       kgPerPiece: 0.035, capacityShift: 0,   producedKg: 0 },
      { name: 'BITES TOTAL',   kgPerPiece: 0.035, capacityShift: 250, producedKg: 0 },
      { name: 'Mig',           kgPerPiece: 0.04,  capacityShift: 120, producedKg: 0 },
    ],
  },
  {
    name: 'Sweetener mixes',
    products: [
      { name: 'SIRUPI',              kgPerPiece: 0.3,    capacityShift: 225, producedKg: 0 },
      { name: 'CHOCODRINK',          kgPerPiece: 0.25,   capacityShift: 250, producedKg: 0 },
      { name: 'ULS1000 gr',          kgPerPiece: 1,      capacityShift: 250, producedKg: 0 },
      { name: 'ULS 300 gr',          kgPerPiece: 0.3,    capacityShift: 250, producedKg: 0 },
      { name: 'ULS 5000gr.',         kgPerPiece: 5,      capacityShift: 250, producedKg: 0 },
      { name: 'PREMIX for Icecream', kgPerPiece: 25,     capacityShift: 0,   producedKg: 0 },
    ],
  },
  {
    name: 'MIX&Inclusions&aroma',
    products: [
      { name: 'Variegate+ soft toffe', kgPerPiece: 22, capacityShift: 0,   producedKg: 0 },
      { name: 'Dought',                kgPerPiece: 4,  capacityShift: 225, producedKg: 0 },
      { name: 'MIX&Inclusions&aroma',  kgPerPiece: 4,  capacityShift: 60,  producedKg: 0 },
    ],
  },
];

const DEFAULT_WASTE = [
  { name: 'Waste simular', kg: 0 },
  { name: 'Waste choco',   kg: 0 },
  { name: 'Waste foil',    kg: 0 },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CAT_COLORS = { Hansela: '#3b82f6', 'OLD&Extruder': '#10b981', 'Sweetener mixes': '#f59e0b', 'MIX&Inclusions&aroma': '#8b5cf6' };

const fmt = (n) => n?.toLocaleString() ?? '0';

// ─── Computed helpers ───────────────────────────────────────────────
const calcPieces = (kg, kgPerPiece) => kgPerPiece > 0 ? Math.round(kg / kgPerPiece) : 0;
const catTotalKg = (cat) => cat.products.reduce((s, p) => s + (p.producedKg || 0), 0);
const allTotalKg = (cats) => cats.reduce((s, c) => s + catTotalKg(c), 0);
const totalWasteKg = (waste) => waste.reduce((s, w) => s + (w.kg || 0), 0);

// ─── Component ──────────────────────────────────────────────────────
const ProductionReport = () => {
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const canEditReport = isTopManagement(user) || user?.department === 'production';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartView, setChartView] = useState('monthly'); // monthly | quarterly | annual
  const [tab, setTab] = useState('details'); // details | charts
  const [editing, setEditing] = useState(false);

  // Fetch report for selected month
  const { data: report, isLoading } = useProductionReport(year, month);
  const { data: summaryData } = useProductionSummary({ year, view: chartView });
  const createMut = useCreateProductionReport();
  const updateMut = useUpdateProductionReport();

  // Local edit state
  const [editCategories, setEditCategories] = useState(null);
  const [editWaste, setEditWaste] = useState(null);
  const [editWorkers, setEditWorkers] = useState(0);
  const [editDays, setEditDays] = useState(0);

  const categories = editing ? editCategories : (report?.categories || DEFAULT_CATEGORIES);
  const waste = editing ? editWaste : (report?.waste || DEFAULT_WASTE);
  const workers = editing ? editWorkers : (report?.workersTotal || 0);
  const days = editing ? editDays : (report?.workingDays || 0);

  const grandTotalKg = allTotalKg(categories);
  const grandWasteKg = totalWasteKg(waste);

  const startEditing = () => {
    setEditCategories(JSON.parse(JSON.stringify(report?.categories || DEFAULT_CATEGORIES)));
    setEditWaste(JSON.parse(JSON.stringify(report?.waste || DEFAULT_WASTE)));
    setEditWorkers(report?.workersTotal || 0);
    setEditDays(report?.workingDays || 0);
    setEditing(true);
  };

  const handleSave = () => {
    const payload = { year, month, categories: editCategories, waste: editWaste, workersTotal: editWorkers, workingDays: editDays };
    if (report) {
      updateMut.mutate(payload, { onSuccess: () => setEditing(false) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setEditing(false) });
    }
  };

  const updateProduct = (catIdx, prodIdx, field, value) => {
    const cats = [...editCategories];
    cats[catIdx] = { ...cats[catIdx], products: [...cats[catIdx].products] };
    cats[catIdx].products[prodIdx] = { ...cats[catIdx].products[prodIdx], [field]: parseFloat(value) || 0 };
    setEditCategories(cats);
  };

  const updateWaste = (idx, field, value) => {
    const w = [...editWaste];
    w[idx] = { ...w[idx], [field]: parseFloat(value) || 0 };
    setEditWaste(w);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  // ── Pie data for current month ──
  const pieData = useMemo(() =>
    categories.map((c) => ({ name: c.name, value: catTotalKg(c) })).filter((d) => d.value > 0),
    [categories]
  );

  // ── KPI Cards ──
  const hanselaTotalKg = catTotalKg(categories.find((c) => c.name === 'Hansela') || { products: [] });
  const hanselaPcs = categories.find((c) => c.name === 'Hansela')
    ? categories.find((c) => c.name === 'Hansela').products.reduce((s, p) => s + calcPieces(p.producedKg, p.kgPerPiece), 0)
    : 0;
  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Month selector + tabs ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft size={18} /></button>
                <span className="text-lg font-bold text-gray-800 min-w-[120px] text-center">
                  {t(`monthNames.${month}`)} {year}
                </span>
                <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100"><ChevronRight size={18} /></button>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
                <button
                  onClick={() => setTab('details')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'details' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                >
                  <Table size={14} /> {t('details')}
                </button>
                <button
                  onClick={() => setTab('charts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'charts' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                >
                  <BarChart3 size={14} /> {t('charts')}
                </button>
              </div>

              {canEditReport && tab === 'details' && !editing && (
                <button onClick={startEditing} className="btn-primary text-sm">
                  {report ? t('editReport') : `+ ${t('createReport')}`}
                </button>
              )}
              {editing && (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary text-sm flex items-center gap-1.5">
                    <Save size={14} /> {t('save')}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm">{tc('cancel')}</button>
                </div>
              )}
            </div>

            {/* ── KPI summary cards ── */}
            {(report || editing) && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiCard label={t('totalKgr')} value={fmt(grandTotalKg)} sub="kg" color="blue" />
                <KpiCard
                  label="Hansela"
                  value={fmt(hanselaTotalKg)}
                  sub={`${fmt(hanselaPcs)} ${t('producedPcs')}`}
                  color="emerald"
                />
                <KpiCard label={t('waste')} value={fmt(grandWasteKg)} sub={`${grandTotalKg > 0 ? ((grandWasteKg / grandTotalKg) * 100).toFixed(2) : 0}%`} color="red" />
                <KpiCard
                  label={t('workersTotal')}
                  value={editing
                    ? <input type="number" className="w-16 text-center bg-transparent border-b border-gray-300 font-bold text-xl outline-none" value={editWorkers} onChange={(e) => setEditWorkers(parseInt(e.target.value) || 0)} />
                    : workers}
                  color="violet"
                />
                <KpiCard
                  label={t('workingDays')}
                  value={editing
                    ? <input type="number" className="w-16 text-center bg-transparent border-b border-gray-300 font-bold text-xl outline-none" value={editDays} onChange={(e) => setEditDays(parseInt(e.target.value) || 0)} />
                    : days}
                  color="amber"
                />
              </div>
            )}

            {isLoading && <p className="text-gray-400 text-sm">{tc('loading')}</p>}

            {/* ═══════════════════ DETAILS TAB ═══════════════════ */}
            {tab === 'details' && (
              <>
                {!report && !editing && !isLoading && (
                  <div className="text-center py-20 text-gray-400 text-sm">{t('noReport')}</div>
                )}

                {(report || editing) && categories.map((cat, ci) => (
                  <div key={ci} className="card overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h3 className="font-bold text-sm text-gray-700">{cat.name}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <th className="text-left px-4 py-2 font-medium w-[200px]">{t('product')}</th>
                            <th className="text-right px-3 py-2 font-medium w-[80px]">{t('kgPerPiece')}</th>
                            <th className="text-right px-3 py-2 font-medium w-[100px]">{t('capacityShift')}</th>
                            <th className="text-right px-3 py-2 font-medium w-[120px]">{t('producedKg')}</th>
                            <th className="text-right px-3 py-2 font-medium w-[120px]">{t('producedPcs')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.products.map((p, pi) => (
                            <tr key={pi} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-4 py-1.5 text-gray-700 font-medium">{p.name}</td>
                              <td className="text-right px-3 py-1.5 text-gray-500">{p.kgPerPiece}</td>
                              <td className="text-right px-3 py-1.5 text-gray-500">{p.capacityShift || '—'}</td>
                              <td className="text-right px-3 py-1.5 font-semibold text-red-600">
                                {editing ? (
                                  <input
                                    type="number"
                                    className="w-24 text-right bg-white border border-gray-200 rounded px-2 py-0.5 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                    value={editCategories[ci].products[pi].producedKg}
                                    onChange={(e) => updateProduct(ci, pi, 'producedKg', e.target.value)}
                                  />
                                ) : fmt(p.producedKg)}
                              </td>
                              <td className="text-right px-3 py-1.5 font-semibold text-gray-800">
                                {fmt(calcPieces(editing ? editCategories[ci].products[pi].producedKg : p.producedKg, p.kgPerPiece))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-bold text-sm">
                            <td colSpan={3} className="px-4 py-2 text-gray-600">{t('total')}</td>
                            <td className="text-right px-3 py-2 text-red-700">{fmt(catTotalKg(editing ? editCategories[ci] : cat))}</td>
                            <td className="text-right px-3 py-2 text-gray-800">
                              {fmt((editing ? editCategories[ci] : cat).products.reduce((s, p) => s + calcPieces(p.producedKg, p.kgPerPiece), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {/* ── Waste table ── */}
                {(report || editing) && (
                  <div className="card overflow-hidden">
                    <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200">
                      <h3 className="font-bold text-sm text-yellow-800">{t('waste')}</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                          <th className="text-left px-4 py-2 font-medium">{t('product')}</th>
                          <th className="text-right px-3 py-2 font-medium w-[120px]">{t('wasteKg')}</th>
                          <th className="text-right px-3 py-2 font-medium w-[100px]">{t('wastePercent')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waste.map((w, wi) => (
                          <tr key={wi} className="border-b border-gray-50">
                            <td className="px-4 py-1.5 text-gray-700 font-medium">{w.name}</td>
                            <td className="text-right px-3 py-1.5 font-semibold text-blue-600">
                              {editing ? (
                                <input
                                  type="number"
                                  className="w-24 text-right bg-white border border-gray-200 rounded px-2 py-0.5 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                  value={editWaste[wi].kg}
                                  onChange={(e) => updateWaste(wi, 'kg', e.target.value)}
                                />
                              ) : fmt(w.kg)}
                            </td>
                            <td className="text-right px-3 py-1.5 font-semibold text-blue-600">
                              {grandTotalKg > 0 ? (((editing ? editWaste[wi].kg : w.kg) / grandTotalKg) * 100).toFixed(2) : '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-yellow-50 font-bold text-sm">
                          <td className="px-4 py-2 text-yellow-800">{t('total')}</td>
                          <td className="text-right px-3 py-2 text-yellow-800">{fmt(grandWasteKg)}</td>
                          <td className="text-right px-3 py-2 text-yellow-800">
                            {grandTotalKg > 0 ? ((grandWasteKg / grandTotalKg) * 100).toFixed(2) : '0.00'}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* ── Pie chart for this month ── */}
                {(report || editing) && pieData.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-semibold text-gray-700 text-sm mb-4">{t('productionByCategory')}</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `${fmt(v)} kg`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══════════════════ CHARTS TAB ═══════════════════ */}
            {tab === 'charts' && (
              <>
                {/* Period selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">{t('charts')}:</span>
                  {['monthly', 'quarterly', 'annual'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        chartView === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t(v)}
                    </button>
                  ))}
                  {chartView !== 'annual' && (
                    <select className="input !w-auto text-sm ml-2" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                      {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                </div>

                {!summaryData?.length ? (
                  <div className="text-center py-16 text-gray-400 text-sm">{t('noReport')}</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Total production bar chart */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-700 text-sm mb-4">{t('totalProduction')}</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summaryData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey={chartView === 'monthly' ? 'label' : chartView === 'quarterly' ? 'label' : 'year'}
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => {
                                if (chartView === 'monthly' && v) {
                                  const m = parseInt(v.split('-')[1]);
                                  return t(`monthNames.${m}`);
                                }
                                return v;
                              }}
                            />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <Tooltip formatter={(v) => `${fmt(v)} kg`} />
                            <Bar dataKey="totalKg" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('totalProduction')} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Production vs Waste */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-700 text-sm mb-4">{t('productionVsWaste')}</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summaryData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey={chartView === 'monthly' ? 'label' : chartView === 'quarterly' ? 'label' : 'year'}
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => {
                                if (chartView === 'monthly' && v) {
                                  const m = parseInt(v.split('-')[1]);
                                  return t(`monthNames.${m}`);
                                }
                                return v;
                              }}
                            />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <Tooltip formatter={(v) => `${fmt(v)} kg`} />
                            <Legend />
                            <Bar dataKey="totalKg" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('totalProduction')} />
                            <Bar dataKey="totalWasteKg" fill="#ef4444" radius={[4, 4, 0, 0]} name={t('totalWaste')} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Waste % trend line */}
                    {chartView === 'monthly' && (
                      <div className="card p-5">
                        <h3 className="font-semibold text-gray-700 text-sm mb-4">{t('wastePercentLabel')}</h3>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summaryData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => {
                                  if (v) { const m = parseInt(v.split('-')[1]); return t(`monthNames.${m}`); }
                                  return v;
                                }}
                              />
                              <YAxis tick={{ fontSize: 11 }} unit="%" />
                              <Tooltip formatter={(v) => `${v}%`} />
                              <Line type="monotone" dataKey="wastePercent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name={t('wastePercentLabel')} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Production by category (stacked area) */}
                    {chartView === 'monthly' && summaryData?.[0]?.Hansela !== undefined && (
                      <div className="card p-5">
                        <h3 className="font-semibold text-gray-700 text-sm mb-4">{t('productionByCategory')}</h3>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summaryData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => {
                                  if (v) { const m = parseInt(v.split('-')[1]); return t(`monthNames.${m}`); }
                                  return v;
                                }}
                              />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                              <Tooltip formatter={(v) => `${fmt(v)} kg`} />
                              <Legend />
                              {Object.entries(CAT_COLORS).map(([name, color]) => (
                                <Area key={name} type="monotone" dataKey={name} stackId="1" stroke={color} fill={color} fillOpacity={0.3} name={name} />
                              ))}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub, color }) => {
  const bgMap = { blue: 'bg-blue-50 border-blue-200', emerald: 'bg-emerald-50 border-emerald-200', red: 'bg-red-50 border-red-200', violet: 'bg-violet-50 border-violet-200', amber: 'bg-amber-50 border-amber-200' };
  const textMap = { blue: 'text-blue-700', emerald: 'text-emerald-700', red: 'text-red-700', violet: 'text-violet-700', amber: 'text-amber-700' };
  return (
    <div className={`rounded-xl border p-4 ${bgMap[color]}`}>
      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${textMap[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
};

export default ProductionReport;
