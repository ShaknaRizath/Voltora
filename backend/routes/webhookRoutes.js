// routes/webhookRoutes.js
// Mounted at POST /api/stripe/webhook *before* express.json() in server.js, because Stripe's
// signature check needs the untouched raw request body.
import express from "express";
import { getStripe, isStripeConfigured } from "../utils/stripe.js";
import { markOrderPaid } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return res.status(503).send("Stripe webhooks are not configured");
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], secret);
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        const order = await markOrderPaid(session.id);
        if (order) console.log("✅ Order paid via webhook:", order._id.toString());
      } catch (err) {
        console.error("❌ Failed to mark order paid:", err.message);
        return res.status(500).send("Failed to update order"); // Stripe will retry
      }
    }
  }

  res.json({ received: true });
});

export default router;
