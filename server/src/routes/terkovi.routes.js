import express from 'express';
import { generateNDA, generatePLAgreement, generateContractAnnex } from '../controllers/terkovi.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// POST /api/terkovi/nda/generate
// Authenticated: any logged-in user (employee, manager, top management) in sales or top_management
router.post('/nda/generate', authenticate, generateNDA);

// POST /api/terkovi/pl-agreement/generate
// Authenticated: sales / top_management
router.post('/pl-agreement/generate', authenticate, generatePLAgreement);

// POST /api/terkovi/contract-annex/generate
// Authenticated: hr / top_management only
router.post('/contract-annex/generate', authenticate, generateContractAnnex);

export default router;
