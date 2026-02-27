import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listAgreements,
  createAgreement,
  updateAgreement,
  renewAgreement,
  terminateAgreement,
  deleteAgreement,
} from '../controllers/agreement.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                    listAgreements);
router.post('/',                   createAgreement);
router.put('/:id',                 updateAgreement);
router.post('/:id/renew',          renewAgreement);
router.post('/:id/terminate',      terminateAgreement);
router.delete('/:id',              deleteAgreement);

export default router;
