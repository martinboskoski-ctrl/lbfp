import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listLeads,
  createLead,
  updateLead,
  addActivity,
  deleteLead,
} from '../controllers/lead.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                    listLeads);
router.post('/',                   createLead);
router.put('/:id',                 updateLead);
router.post('/:id/activities',     addActivity);
router.delete('/:id',              deleteLead);

export default router;
