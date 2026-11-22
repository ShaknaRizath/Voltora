import mongoose from 'mongoose';

// One in-app message for one customer (repair update, delivered order...). Removed automatically after 60 days.
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['repair', 'order'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, default: '', maxlength: 300 },
  link: { type: String, default: '' }, // frontend route to open when clicked
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 60 * 24 * 60 * 60 },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
