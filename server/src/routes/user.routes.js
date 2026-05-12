import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import { listUsers, listDirectory, updateLanguage, changePassword } from '../controllers/user.controller.js';
import {
  listUsers   as adminListUsers,
  getUser     as adminGetUser,
  updateUser  as adminUpdateUser,
  suspendUser,
  reactivateUser,
  deleteUser  as adminDeleteUser,
  resetPassword as adminResetPassword,
} from '../controllers/userAdmin.controller.js';

const router = Router();

router.use(authenticate);

// Accessible to all authenticated users
router.get('/directory', listDirectory);
router.patch('/me/language', updateLanguage);
router.patch('/me/password', changePassword);

// Top-management user management (gated inside each handler)
router.get   ('/admin',                       adminListUsers);
router.get   ('/admin/:id',                   adminGetUser);
router.patch ('/admin/:id',                   adminUpdateUser);
router.post  ('/admin/:id/suspend',           suspendUser);
router.post  ('/admin/:id/reactivate',        reactivateUser);
router.delete('/admin/:id',                   adminDeleteUser);
router.post  ('/admin/:id/reset-password',    adminResetPassword);

// Legacy admin role list
router.use(requireRole('admin'));
router.get('/', listUsers);

export default router;
