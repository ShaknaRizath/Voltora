// backend/routes/stripeRoutes.js
import express from "express";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { clientUrl, getStripe, isStripeConfigured } from "../utils/stripe.js";

const router = express.Router();

const MAX_QTY = 20;

router.post("/create-checkout-session", verifyToken, async (req, res, next) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error: "Payments aren't set up yet. Add a real Stripe test key as STRIPE_SECRET_KEY in backend/.env.",
    });
  }

  let order;
  try {
    // 1. Only product ids and quantities are trusted from the browser. Prices, names and
    //    images are always read from the database, so they can't be tampered with.
    const wanted = new Map();
    for (const item of Array.isArray(req.body.items) ? req.body.items : []) {
      if (!mongoose.isValidObjectId(item?._id)) continue;
      const qty = Math.min(MAX_QTY, Math.max(1, parseInt(item.qty, 10) || 1));
      const id = String(item._id);
      wanted.set(id, Math.min(MAX_QTY, (wanted.get(id) || 0) + qty));
    }
    if (wanted.size === 0) return res.status(400).json({ error: "Your cart is empty." });

    const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
    if (products.length !== wanted.size) {
      return res.status(400).json({ error: "Some items in your cart are no longer available." });
    }

    const orderItems = products.map((p) => ({
      product: p._id,
      title: p.title,
      image: p.image,
      qty: wanted.get(p._id.toString()),
      price: p.discountPrice,
    }));
    const total = orderItems.reduce((sum, i) => sum + i.qty * i.price, 0);

    // 2. Record the order as unpaid. It becomes paid only when Stripe confirms the payment.
    order = await Order.create({ userId: req.user.userId, items: orderItems, total, isPaid: false });

    const user = await User.findById(req.user.userId).select("email");

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user?.email,
      client_reference_id: order._id.toString(),
      metadata: { orderId: order._id.toString() },
      line_items: orderItems.map((i) => ({
        quantity: i.qty,
        price_data: {
          currency: "lkr",
          unit_amount: Math.round(i.price * 100), // smallest currency unit
          product_data: {
            name: i.title,
            // Stripe only accepts public http(s) image URLs, not local /src/assets paths.
            ...(/^https?:\/\//.test(i.image) ? { images: [i.image] } : {}),
          },
        },
      })),
      success_url: `${clientUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl()}/cart`,
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.json({ url: session.url });
  } catch (error) {
    if (order && !order.stripeSessionId) await Order.findByIdAndDelete(order._id).catch(() => {});
    console.error("Stripe session error:", error.message);
    if (error.type && error.type.startsWith("Stripe")) {
      return res.status(502).json({ error: "We couldn't start the payment. Please try again." });
    }
    next(error);
  }
});

export default router;
