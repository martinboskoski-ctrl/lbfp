import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { initiateUpload, confirmUpload, getDownloadUrl } from '../controllers/file.controller.js';

const router = Router();

router.use(authenticate);

router.post('/upload', initiateUpload);
router.patch('/:id/confirm', confirmUpload);
router.get('/:id/url', getDownloadUrl);

export default router;
