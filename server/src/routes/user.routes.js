import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import { listUsers, listDirectory, updateLanguage, changePassword } from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate);

// Accessible to all authenticated users
router.get('/directory', listDirectory);
router.patch('/me/language', updateLanguage);
router.patch('/me/password', changePassword);

// Admin-only
router.use(requireRole('admin'));
router.get('/', listUsers);

export default router;
