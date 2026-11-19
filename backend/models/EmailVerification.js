import mongoose from 'mongoose';

// A pending registration code for an email address. Documents delete themselves
// (MongoDB TTL index on expiresAt) shortly after the code expires.
const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export default mongoose.model('EmailVerification', emailVerificationSchema);
