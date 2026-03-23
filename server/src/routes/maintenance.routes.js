import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as ctrl from '../controllers/maintenance.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',    ctrl.list);
router.post('/',   ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);

export default router;
