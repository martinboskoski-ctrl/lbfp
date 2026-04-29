import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listAgreements,
  getAgreement,
  createAgreement,
  updateAgreement,
  renewAgreement,
  terminateAgreement,
  deleteAgreement,
  addNote,
  initiateFileUpload,
  confirmFileUpload,
  getFileDownloadUrl,
  deleteFile,
  triggerReminders,
} from '../controllers/agreement.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                            listAgreements);
router.post('/',                           createAgreement);
router.post('/dispatch-reminders',         triggerReminders);

router.get('/:id',                         getAgreement);
router.put('/:id',                         updateAgreement);
router.delete('/:id',                      deleteAgreement);

router.post('/:id/renew',                  renewAgreement);
router.post('/:id/terminate',              terminateAgreement);
router.post('/:id/notes',                  addNote);

router.post('/:id/files/initiate',         initiateFileUpload);
router.patch('/:id/files/:fileId/confirm', confirmFileUpload);
router.get('/:id/files/:fileId/url',       getFileDownloadUrl);
router.delete('/:id/files/:fileId',        deleteFile);

export default router;
