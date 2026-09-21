import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { downloadBackup } from '../controllers/backup.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', downloadBackup);

export default router;
