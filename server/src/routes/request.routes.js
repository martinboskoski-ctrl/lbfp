import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as ctrl from '../controllers/request.controller.js';

const router = Router();

router.use(authenticate);

router.post('/',                ctrl.create);
router.get('/mine',             ctrl.mine);
router.get('/pending',          ctrl.pending);
router.get('/stats/overview',   ctrl.stats);
router.get('/:id',              ctrl.getOne);
router.patch('/:id/approve',    ctrl.approve);
router.patch('/:id/reject',     ctrl.reject);

export default router;
