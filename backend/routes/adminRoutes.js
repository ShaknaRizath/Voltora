import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validate.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  getStats,
  listAllOrders,
  setDelivered,
  listUsers,
  setUserRole,
  deleteUser,
  listWarranties,
  deleteWarranty,
  uploadImage,
  setProductPosition,
} from '../controllers/adminController.js';

const router = express.Router();

// Every admin route requires a signed-in admin.
router.use(verifyToken, isAdmin);
router.param('id', validateObjectId);

router.get('/stats', getStats);

router.get('/orders', listAllOrders);
router.patch('/orders/:id/delivered', setDelivered);

router.get('/users', listUsers);
router.patch('/users/:id/role', setUserRole);
router.delete('/users/:id', deleteUser);

router.get('/warranties', listWarranties);
router.delete('/warranties/:id', deleteWarranty);

router.patch('/products/:id/position', setProductPosition);

router.post('/upload', upload.single('image'), uploadImage);

export default router;
