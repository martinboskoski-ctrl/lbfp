import express from 'express';
import { generateNDA } from '../controllers/terkovi.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// POST /api/terkovi/nda/generate
// Authenticated: any logged-in user (employee, manager, top management) in sales or top_management
router.post('/nda/generate', authenticate, generateNDA);

export default router;
