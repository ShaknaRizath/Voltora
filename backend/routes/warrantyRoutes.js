import express from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { lookupWarranty, myWarranties, adminCreateWarranty } from '../controllers/warrantyController.js';

const router = express.Router();

// The public lookup takes a guessable-looking input, so it is rate limited per IP.
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many lookups. Please try again in a few minutes.' },
});

router.get('/lookup/:serial', lookupLimiter, lookupWarranty); // public
router.get('/mine', verifyToken, myWarranties); // the signed-in customer's own units
router.post('/', verifyToken, isAdmin, adminCreateWarranty); // admin: register an in-store sale

export default router;
