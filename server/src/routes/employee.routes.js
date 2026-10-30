import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listEmployees, getEmployeeFile,
  addLeaveEntry, deleteLeaveEntry, setLeaveEntitlement, addDiscipline, deleteDiscipline,
} from '../controllers/employee.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listEmployees);
router.get('/:id', getEmployeeFile);

router.post('/:id/leave',                       addLeaveEntry);
router.delete('/:id/leave/:entryId',            deleteLeaveEntry);
router.put('/:id/leave/entitlement/:year',      setLeaveEntitlement);
router.post('/:id/discipline',                  addDiscipline);
router.delete('/:id/discipline/:actionId',      deleteDiscipline);

export default router;
