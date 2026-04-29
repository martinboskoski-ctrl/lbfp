import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { listEmployees, getEmployeeFile } from '../controllers/employee.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listEmployees);
router.get('/:id', getEmployeeFile);

export default router;
