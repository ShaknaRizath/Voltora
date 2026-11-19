import Stripe from "stripe";

// Real Stripe keys are long (100+ chars). Anything short, such as the "sk_test_dummy"
// placeholder, is treated as "not configured" so we can return a clear message.
export const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return /^sk_(test|live)_/.test(key) && key.length > 30;
};

let client;
export const getStripe = () => {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
};

export const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
