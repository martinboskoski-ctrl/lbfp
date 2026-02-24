import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import {
  approveGate,
  rejectGateHandler,
  addComment,
  dispatchGate4Feedback,
  acknowledgeGate4,
} from '../controllers/gate.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/:n/approve', requireRole('reviewer', 'admin'), approveGate);
router.post('/:n/reject', requireRole('reviewer', 'admin'), rejectGateHandler);
router.post('/:n/comments', addComment);
router.post('/dispatch-feedback', requireRole('owner', 'admin'), dispatchGate4Feedback);
router.post('/acknowledge', requireRole('client', 'admin'), acknowledgeGate4);

export default router;
