import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listPOs, createPO, getPO, updatePO, toggleStatus,
  addQuestion, answerQuestion, resolveQuestion, deletePO,
} from '../controllers/po.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                              listPOs);
router.post('/',                             createPO);
router.get('/:id',                           getPO);
router.patch('/:id',                         updatePO);
router.patch('/:id/status',                  toggleStatus);
router.post('/:id/questions',                addQuestion);
router.patch('/:id/questions/:qid/answer',   answerQuestion);
router.patch('/:id/questions/:qid/resolve',  resolveQuestion);
router.delete('/:id',                        deletePO);

export default router;
