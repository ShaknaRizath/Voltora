import mongoose from 'mongoose';

// One document per physical unit sold. Units bought online get theirs automatically when the
// order is paid; in-store sales are registered by an admin.
const warrantySchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, trim: true }, // as displayed, e.g. VLT-7K2Q-9XMA
    serialKey: { type: String, required: true, unique: true }, // normalised for lookups, e.g. VLT7K2Q9XMA
    productName: { type: String, required: true, trim: true, maxlength: 120 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    purchasedAt: { type: Date, required: true, default: Date.now },
    warrantyMonths: { type: Number, required: true, min: 1, max: 60, default: 12 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Warranty', warrantySchema);
