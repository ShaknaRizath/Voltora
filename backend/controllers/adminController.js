// Admin-only endpoints that power the /admin dashboard.
// Everything here is mounted behind verifyToken + isAdmin (see routes/adminRoutes.js).
import User from '../models/User.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Repair from '../models/Repair.js';
import Warranty from '../models/Warranty.js';
import { publicPath } from '../middleware/uploadMiddleware.js';
import { moveProduct } from '../utils/productOrder.js';
import { notifyOrderDelivered } from '../utils/notify.js';

const TZ = 'Asia/Colombo';
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD

const warrantyStatus = (w) => {
  const msLeft = new Date(w.expiresAt).getTime() - Date.now();
  return { status: msLeft > 0 ? 'active' : 'expired', daysRemaining: Math.max(0, Math.ceil(msLeft / 86_400_000)) };
};

// GET /api/admin/counts   (small and cheap: polled by the header badges)
// Numbers are what is NEW since this admin last opened that section, so they clear once looked at.
export const getCounts = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId, 'adminSeen').lean();
    const since = (key) => me?.adminSeen?.[key] || new Date(0);
    const [pendingRepairs, toDeliver] = await Promise.all([
      Repair.countDocuments({ status: 'Pending', submittedAt: { $gt: since('repairs') } }),
      Order.countDocuments({ isPaid: true, isDelivered: false, paidAt: { $gt: since('orders') } }),
    ]);
    res.json({ pendingRepairs, toDeliver });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/seen   { section: 'repairs' | 'orders' }
export const markSeen = async (req, res, next) => {
  try {
    const { section } = req.body;
    if (!['repairs', 'orders'].includes(section)) return res.status(400).json({ message: 'Section must be repairs or orders' });
    await User.updateOne({ _id: req.user.userId }, { $set: { [`adminSeen.${section}`]: new Date() } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats
export const getStats = async (_req, res, next) => {
  try {
    const DAYS = 14;
    const since = new Date(Date.now() - (DAYS - 1) * 86_400_000);
    since.setHours(0, 0, 0, 0);

    const [users, products, paidOrders, toDeliver, revenue, repairsAgg, warranties, daily, top, recent] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ isPaid: true }),
      Order.countDocuments({ isPaid: true, isDelivered: false }),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Repair.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Warranty.find({}, 'expiresAt').lean(),
      Order.aggregate([
        { $match: { isPaid: true, paidAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: TZ } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.title',
            units: { $sum: '$items.qty' },
            revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
          },
        },
        { $sort: { units: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.find({ isPaid: true }).sort({ createdAt: -1 }).limit(6).populate('userId', 'username email').lean(),
    ]);

    // Fill days with no sales so the chart has a continuous axis.
    const byDay = new Map(daily.map((d) => [d._id, d]));
    const series = Array.from({ length: DAYS }, (_, i) => {
      const date = dayKey(new Date(since.getTime() + i * 86_400_000));
      const hit = byDay.get(date);
      return { date, revenue: hit?.revenue || 0, orders: hit?.orders || 0 };
    });

    const repairs = Object.fromEntries(repairsAgg.map((r) => [r._id, r.count]));
    const now = Date.now();

    res.json({
      users,
      products,
      paidOrders,
      toDeliver,
      revenue: revenue[0]?.total || 0,
      repairs,
      repairsTotal: repairsAgg.reduce((n, r) => n + r.count, 0),
      warrantiesTotal: warranties.length,
      warrantiesActive: warranties.filter((w) => new Date(w.expiresAt).getTime() > now).length,
      series,
      topProducts: top.map((t) => ({ title: t._id, units: t.units, revenue: t.revenue })),
      recentOrders: recent.map((o) => ({
        _id: o._id,
        total: o.total,
        createdAt: o.createdAt,
        isDelivered: o.isDelivered,
        customer: o.userId ? o.userId.username : 'Guest',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders?status=paid|unpaid|all
export const listAllOrders = async (req, res, next) => {
  try {
    const status = String(req.query.status || 'paid');
    const filter = status === 'all' ? {} : { isPaid: status !== 'unpaid' };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500).populate('userId', 'name username email mobile').lean();
    res.json(
      orders.map(({ userId, ...o }) => ({
        ...o,
        customer: userId ? { _id: userId._id, name: userId.name, username: userId.username, email: userId.email, mobile: userId.mobile } : null,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/orders/:id/delivered   { delivered: true | false }
export const setDelivered = async (req, res, next) => {
  try {
    const delivered = req.body.delivered === true || req.body.delivered === 'true';
    const before = await Order.findOne({ _id: req.params.id, isPaid: true }, 'isDelivered');
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isPaid: true },
      { isDelivered: delivered, deliveredAt: delivered ? new Date() : undefined },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Paid order not found' });
    if (delivered && !before?.isDelivered) await notifyOrderDelivered(order);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const listUsers = async (_req, res, next) => {
  try {
    const [users, spend] = await Promise.all([
      User.find().sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { isPaid: true, userId: { $ne: null } } },
        { $group: { _id: '$userId', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
      ]),
    ]);
    const bySpend = new Map(spend.map((s) => [String(s._id), s]));
    res.json(
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        profileImage: u.profileImage,
        createdAt: u.createdAt,
        orders: bySpend.get(String(u._id))?.orders || 0,
        spent: bySpend.get(String(u._id))?.spent || 0,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role   { role: 'user' | 'admin' }
export const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Role must be user or admin' });
    if (req.params.id === req.user.userId && role !== 'admin') {
      return res.status(400).json({ message: "You can't remove your own admin access" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save({ validateModifiedOnly: true });
    res.json({ _id: user._id, role: user.role });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) return res.status(400).json({ message: "You can't delete your own account here" });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/warranties
export const listWarranties = async (_req, res, next) => {
  try {
    const list = await Warranty.find().sort({ createdAt: -1 }).limit(500).populate('userId', 'username email').lean();
    res.json(
      list.map(({ userId, serialKey, ...w }) => ({ // eslint-disable-line no-unused-vars
        ...w,
        ...warrantyStatus(w),
        owner: userId ? { username: userId.username, email: userId.email } : null,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/warranties/:id
export const deleteWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findByIdAndDelete(req.params.id);
    if (!warranty) return res.status(404).json({ message: 'Warranty not found' });
    res.json({ message: 'Warranty deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/upload   (multipart, field "image") -> { path: "uploads/..." }
export const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload' });
  res.status(201).json({ path: publicPath(req.file) });
};

// PATCH /api/admin/products/:id/position   { position: 1 } -> the full new order
export const setProductPosition = async (req, res, next) => {
  try {
    const position = Number(req.body.position);
    if (!Number.isInteger(position) || position < 1) {
      return res.status(400).json({ message: 'Position must be a whole number, 1 or higher' });
    }
    const order = await moveProduct(req.params.id, position);
    if (!order) return res.status(404).json({ message: 'Product not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};
