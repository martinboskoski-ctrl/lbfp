import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authenticate from '../middleware/auth.js';
import { status, chat } from '../controllers/assistant.controller.js';

// Per-user cap on questions (each one costs an OpenAI call).
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { message: 'Премногу прашања за кратко време. Обидете се повторно по неколку минути.' },
});

const router = Router();
router.use(authenticate);

router.get('/status', status);
router.post('/chat', chatLimiter, chat);

export default router;
