import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  getProjectFiles,
} from '../controllers/project.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',     listProjects);
router.post('/',    createProject);
router.get('/:id',  getProject);
router.put('/:id',  updateProject);
router.get('/:id/files', getProjectFiles);

export default router;
