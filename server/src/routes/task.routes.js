import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listTasks, createTask, updateTask, updateStatus, approveTask, deleteTask,
  requestChange, resolveChangeRequest,
} from '../controllers/task.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',              listTasks);
router.post('/',             createTask);
router.patch('/:id',         updateTask);
router.patch('/:id/status',  updateStatus);
router.patch('/:id/approve', approveTask);
router.post('/:id/change-requests',               requestChange);
router.patch('/:id/change-requests/:crId/resolve', resolveChangeRequest);
router.delete('/:id',        deleteTask);

export default router;
