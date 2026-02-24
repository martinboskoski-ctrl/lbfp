import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listAnnouncements, createAnnouncement, deleteAnnouncement,
} from '../controllers/announcement.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',        listAnnouncements);
router.post('/',       createAnnouncement);
router.delete('/:id',  deleteAnnouncement);

export default router;
