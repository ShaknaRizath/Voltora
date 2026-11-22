import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validate.js';

const router = express.Router();
router.use(verifyToken);
router.param('id', validateObjectId);

// GET /api/notifications -> { unread, items: [latest 20] }
router.get('/', async (req, res, next) => {
  try {
    const [unread, items] = await Promise.all([
      Notification.countDocuments({ userId: req.user.userId, read: false }),
      Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    res.json({ unread, items });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, userId: req.user.userId }, { read: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
