import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { isOwnerOrAdmin } from '../middleware/ownershipMiddleware.js';
import { validateObjectId } from '../middleware/validate.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  createRepair,
  getAllRepairs,
  getRepairById,
  getGallery,
  updateRepair,
  adminUpdateRepair,
  deleteRepair,
} from '../controllers/repairController.js';

const router = express.Router();

router.param('id', validateObjectId);

// Create a new repair request with damaged image upload (signed in)
router.post('/', verifyToken, upload.single('damagedImage'), createRepair);

// List repairs: a customer's own (admins see all). Signed in.
router.get('/', verifyToken, getAllRepairs);

// Public before/after gallery (anonymous). Must stay above "/:id".
router.get('/gallery', getGallery);

// A single repair: only its owner or an admin
router.get('/:id', verifyToken, isOwnerOrAdmin, getRepairById);

// Owner/admin: update description and damaged image
router.put('/:id', verifyToken, isOwnerOrAdmin, upload.single('damagedImage'), updateRepair);

// Admin only: update status/flags and the repaired image
router.put('/:id/admin', verifyToken, isAdmin, upload.single('repairedImage'), adminUpdateRepair);

// Delete a repair request (owner or admin)
router.delete('/:id', verifyToken, isOwnerOrAdmin, deleteRepair);

export default router;
