import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { list, getOne, create, update, remove, summary } from '../controllers/productionReport.controller.js';

const router = Router();
router.use(authenticate);

router.get('/summary',       summary);
router.get('/',              list);
router.get('/:year/:month',  getOne);
router.post('/',             create);
router.put('/:year/:month',  update);
router.delete('/:year/:month', remove);

export default router;
