import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listTasks, createTask, updateStatus, approveTask, deleteTask,
} from '../controllers/task.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',              listTasks);
router.post('/',             createTask);
router.patch('/:id/status',  updateStatus);
router.patch('/:id/approve', approveTask);
router.delete('/:id',        deleteTask);

export default router;
