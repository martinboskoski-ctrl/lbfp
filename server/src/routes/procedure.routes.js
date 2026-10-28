import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { list, create, getOne, downloadPdf, remove } from '../controllers/procedure.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',    list);
router.post('/',   create);
router.get('/:id', getOne);
router.get('/:id/pdf', downloadPdf);
router.delete('/:id', remove);

export default router;
