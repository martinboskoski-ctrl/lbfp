import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

// Max 10 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Премногу неуспешни обиди. Обидете се повторно по 15 минути.' },
});

// Max 5 registrations per IP per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Премногу барања за регистрација. Обидете се подоцна.' },
});

router.post('/register', registerLimiter, register);
router.post('/login',    loginLimiter,    login);
router.get('/me',        authenticate,    getMe);

export default router;
