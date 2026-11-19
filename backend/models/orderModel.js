// models/orderModel.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        image: String,
        qty: Number,
        price: Number, // unit price in LKR, taken from the database at checkout time
      },
    ],
    total: Number,

    // An order is created when checkout starts and flips to paid once Stripe confirms the payment.
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    stripeSessionId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
