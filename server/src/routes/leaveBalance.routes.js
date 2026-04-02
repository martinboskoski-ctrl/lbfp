import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as ctrl from '../controllers/leaveBalance.controller.js';

const router = Router();

router.use(authenticate);

router.get('/mine',           ctrl.mine);
router.get('/all',            ctrl.all);
router.put('/user/:userId',   ctrl.update);
router.post('/init-year',     ctrl.initYear);

export default router;
