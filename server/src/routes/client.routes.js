import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  addOrder,
  updateOrder,
  deleteOrder,
  addActivity,
  editActivity,
} from '../controllers/client.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                          listClients);
router.post('/',                         createClient);
router.put('/:id',                       updateClient);
router.delete('/:id',                    deleteClient);

router.post('/:id/orders',               addOrder);
router.put('/:id/orders/:orderId',       updateOrder);
router.delete('/:id/orders/:orderId',    deleteOrder);

router.post('/:id/activities',           addActivity);
router.patch('/:id/activities/:activityId', editActivity);

export default router;
