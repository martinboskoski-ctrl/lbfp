/**
 * Seed script for production reports.
 * Run: node --env-file=.env src/seeds/productionReportSeed.js
 *
 * Creates sample reports for Jan–Dec 2024 + Jan–Mar 2025
 * so that the charts have monthly, quarterly, and annual data.
 */
import mongoose from 'mongoose';
import 'dotenv/config';
import ProductionReport from '../models/ProductionReport.js';
import User from '../models/User.js';

const CATEGORIES_TEMPLATE = [
  {
    name: 'Hansela',
    products: [
      { name: 'SW / USA (0.028)',  kgPerPiece: 0.028, capacityShift: 900 },
      { name: 'SW / USA (0.04)',   kgPerPiece: 0.04,  capacityShift: 2300 },
      { name: 'SW / USA (0.05)',   kgPerPiece: 0.05,  capacityShift: 1950 },
      { name: 'Israel',            kgPerPiece: 0.065, capacityShift: 1950 },
      { name: '(0.04)',            kgPerPiece: 0.04,  capacityShift: 120 },
      { name: 'Minis',             kgPerPiece: 0.02,  capacityShift: 120 },
    ],
  },
  {
    name: 'OLD&Extruder',
    products: [
      { name: 'OATLOWS',       kgPerPiece: 0.06,  capacityShift: 600 },
      { name: 'Oat bar',       kgPerPiece: 0.035, capacityShift: 0 },
      { name: 'BITES TOTAL',   kgPerPiece: 0.035, capacityShift: 250 },
      { name: 'Mig',           kgPerPiece: 0.04,  capacityShift: 120 },
    ],
  },
  {
    name: 'Sweetener mixes',
    products: [
      { name: 'SIRUPI',              kgPerPiece: 0.3,  capacityShift: 225 },
      { name: 'CHOCODRINK',          kgPerPiece: 0.25, capacityShift: 250 },
      { name: 'ULS1000 gr',          kgPerPiece: 1,    capacityShift: 250 },
      { name: 'ULS 300 gr',          kgPerPiece: 0.3,  capacityShift: 250 },
      { name: 'ULS 5000gr.',         kgPerPiece: 5,    capacityShift: 250 },
      { name: 'PREMIX for Icecream', kgPerPiece: 25,   capacityShift: 0 },
    ],
  },
  {
    name: 'MIX&Inclusions&aroma',
    products: [
      { name: 'Variegate+ soft toffe', kgPerPiece: 22, capacityShift: 0 },
      { name: 'Dought',                kgPerPiece: 4,  capacityShift: 225 },
      { name: 'MIX&Inclusions&aroma',  kgPerPiece: 4,  capacityShift: 60 },
    ],
  },
];

const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const makeReport = (year, month) => {
  const categories = CATEGORIES_TEMPLATE.map((cat) => ({
    name: cat.name,
    products: cat.products.map((p) => {
      // Generate plausible production numbers
      let producedKg;
      if (cat.name === 'Hansela') producedKg = rand(500, 80000);
      else if (cat.name === 'OLD&Extruder') producedKg = rand(0, 5000);
      else if (cat.name === 'Sweetener mixes') producedKg = rand(100, 15000);
      else producedKg = rand(500, 6000);

      return { ...p, producedKg };
    }),
  }));

  const totalKg = categories.reduce((s, c) =>
    s + c.products.reduce((ps, p) => ps + p.producedKg, 0), 0);

  return {
    year,
    month,
    categories,
    waste: [
      { name: 'Waste simular', kg: Math.round(totalKg * (rand(15, 35) / 1000)) },
      { name: 'Waste choco',   kg: Math.round(totalKg * (rand(4, 10) / 1000)) },
      { name: 'Waste foil',    kg: Math.round(totalKg * (rand(15, 35) / 1000)) },
    ],
    workersTotal: rand(95, 115),
    workingDays: rand(20, 26),
  };
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find any user to use as createdBy
  const user = await User.findOne();
  if (!user) {
    console.error('No user found in DB. Create a user first.');
    process.exit(1);
  }

  // Clear existing
  await ProductionReport.deleteMany({});
  console.log('Cleared existing production reports');

  const reports = [];

  // 2024 full year
  for (let m = 1; m <= 12; m++) {
    reports.push({ ...makeReport(2024, m), createdBy: user._id });
  }
  // 2025 Jan-Mar
  for (let m = 1; m <= 3; m++) {
    reports.push({ ...makeReport(2025, m), createdBy: user._id });
  }

  // April 2024 — use the actual data from the spreadsheet
  const apr24 = reports.find((r) => r.year === 2024 && r.month === 4);
  if (apr24) {
    apr24.categories = [
      {
        name: 'Hansela',
        products: [
          { name: 'SW / USA (0.028)',  kgPerPiece: 0.028, capacityShift: 900,  producedKg: 1058 },
          { name: 'SW / USA (0.04)',   kgPerPiece: 0.04,  capacityShift: 2300, producedKg: 20722 },
          { name: 'SW / USA (0.05)',   kgPerPiece: 0.05,  capacityShift: 1950, producedKg: 76776 },
          { name: 'Israel',            kgPerPiece: 0.065, capacityShift: 1950, producedKg: 9931 },
          { name: '(0.04)',            kgPerPiece: 0.04,  capacityShift: 120,  producedKg: 0 },
          { name: 'Minis',             kgPerPiece: 0.02,  capacityShift: 120,  producedKg: 5646 },
        ],
      },
      {
        name: 'OLD&Extruder',
        products: [
          { name: 'OATLOWS',       kgPerPiece: 0.06,  capacityShift: 600, producedKg: 0 },
          { name: 'Oat bar',       kgPerPiece: 0.035, capacityShift: 0,   producedKg: 3814 },
          { name: 'BITES TOTAL',   kgPerPiece: 0.035, capacityShift: 250, producedKg: 0 },
          { name: 'Mig',           kgPerPiece: 0.04,  capacityShift: 120, producedKg: 0 },
        ],
      },
      {
        name: 'Sweetener mixes',
        products: [
          { name: 'SIRUPI',              kgPerPiece: 0.3,    capacityShift: 225, producedKg: 286 },
          { name: 'CHOCODRINK',          kgPerPiece: 0.25,   capacityShift: 250, producedKg: 409 },
          { name: 'ULS1000 gr',          kgPerPiece: 1,      capacityShift: 250, producedKg: 828 },
          { name: 'ULS 300 gr',          kgPerPiece: 0.3,    capacityShift: 250, producedKg: 2055 },
          { name: 'ULS 5000gr.',         kgPerPiece: 5,      capacityShift: 250, producedKg: 0 },
          { name: 'PREMIX for Icecream', kgPerPiece: 25,     capacityShift: 0,   producedKg: 14400 },
        ],
      },
      {
        name: 'MIX&Inclusions&aroma',
        products: [
          { name: 'Variegate+ soft toffe', kgPerPiece: 22, capacityShift: 0,   producedKg: 5316 },
          { name: 'Dought',                kgPerPiece: 4,  capacityShift: 225, producedKg: 2064 },
          { name: 'MIX&Inclusions&aroma',  kgPerPiece: 4,  capacityShift: 60,  producedKg: 1297 },
        ],
      },
    ];
    apr24.waste = [
      { name: 'Waste simular', kg: 2890 },
      { name: 'Waste choco',   kg: 781 },
      { name: 'Waste foil',    kg: 78 },
    ];
    apr24.workersTotal = 105;
    apr24.workingDays = 55;
  }

  await ProductionReport.insertMany(reports);
  console.log(`Seeded ${reports.length} production reports`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => { console.error(err); process.exit(1); });
