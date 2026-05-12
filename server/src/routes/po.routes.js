import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listPOs, createPO, getPO, updatePO, toggleStatus,
  addQuestion, answerQuestion, resolveQuestion, deletePO,
  postThread, markFinalAnswer, salesReview, clientApproval,
  deptInbox, digest,
} from '../controllers/po.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                              listPOs);
router.post('/',                             createPO);
router.get('/inbox',                         deptInbox);
router.get('/:id',                           getPO);
router.patch('/:id',                         updatePO);
router.patch('/:id/status',                  toggleStatus);
router.get('/:id/digest',                    digest);
router.post('/:id/questions',                addQuestion);
router.patch('/:id/questions/:qid/answer',   answerQuestion);          // legacy
router.patch('/:id/questions/:qid/resolve',  resolveQuestion);         // legacy
router.post('/:id/questions/:qid/thread',    postThread);
router.patch('/:id/questions/:qid/final',    markFinalAnswer);
router.patch('/:id/questions/:qid/review',   salesReview);
router.patch('/:id/questions/:qid/approval', clientApproval);
router.delete('/:id',                        deletePO);

export default router;
