import Order from "../models/orderModel.js";
import { getStripe, isStripeConfigured } from "../utils/stripe.js";
import { createWarrantiesForOrder } from "./warrantyController.js";
import { notifyOrderDelivered } from "../utils/notify.js";

// Idempotent: safe to call from both the webhook and the success-page confirmation.
export const markOrderPaid = async (stripeSessionId) => {
  const order = await Order.findOneAndUpdate(
    { stripeSessionId, isPaid: false },
    { isPaid: true, paidAt: new Date() },
    { new: true }
  );
  // Only the call that actually flips the order to paid gets an order back, so warranties
  // are created exactly once even if the webhook and the success page both fire.
  if (order) {
    await createWarrantiesForOrder(order).catch((err) => console.error("Warranty creation failed:", err.message));
  }
  return order;
};

const canView = (order, user) =>
  user.role === "admin" || (order.userId && order.userId.toString() === user.userId);

// GET /api/orders  → the signed-in user's paid orders (admins can pass ?all=true)
export const listOrders = async (req, res, next) => {
  try {
    const filter = { isPaid: true };
    if (!(req.user.role === "admin" && req.query.all === "true")) filter.userId = req.user.userId;
    res.json(await Order.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    // Same answer for "missing" and "not yours" so ids can't be probed.
    if (!order || !canView(order, req.user)) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/confirm?session_id=cs_...
// Called by the payment-success page. Asks Stripe directly whether the session was paid, so
// orders are confirmed even when webhooks aren't reachable (e.g. local development).
export const confirmCheckout = async (req, res, next) => {
  try {
    const sessionId = String(req.query.session_id || "");
    if (!sessionId.startsWith("cs_")) return res.status(400).json({ message: "Invalid session id" });

    const order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order || !canView(order, req.user)) return res.status(404).json({ message: "Order not found" });

    if (order.isPaid) return res.json({ paid: true, orderId: order._id });

    if (!isStripeConfigured()) {
      return res.status(503).json({ message: "Payments are not configured on the server." });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await markOrderPaid(sessionId);
      return res.json({ paid: true, orderId: order._id });
    }
    res.json({ paid: false, orderId: order._id });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/deliver  (admin)
export const markDelivered = async (req, res, next) => {
  try {
    const before = await Order.findOne({ _id: req.params.id, isPaid: true }, "isDelivered");
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isPaid: true },
      { isDelivered: true, deliveredAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Paid order not found" });
    if (!before?.isDelivered) await notifyOrderDelivered(order);
    res.json(order);
  } catch (error) {
    next(error);
  }
};
