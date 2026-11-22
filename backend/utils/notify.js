import Notification from '../models/Notification.js';

// Best effort: a failed notification must never break the action that triggered it.
export const notify = async (userId, { type, title, message = '', link = '' }) => {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    console.error('Could not create notification:', err.message);
  }
};

const REPAIR_TEXT = {
  Approved: 'was approved',
  'In Progress': 'is now in progress',
  Resolved: 'is done and ready for you',
  Rejected: 'could not be accepted',
  Pending: 'is back to pending',
};

export const notifyRepairStatus = (repair) =>
  notify(repair.createdBy, {
    type: 'repair',
    title: repair.status === 'Resolved' ? 'Your repair is done' : 'Repair update',
    message: `Your repair ${repair.productId} (${repair.productName}) ${REPAIR_TEXT[repair.status] || `is now ${repair.status}`}.`,
    link: `/repair/${repair._id}`,
  });

export const notifyOrderDelivered = (order) =>
  notify(order.userId, {
    type: 'order',
    title: 'Your order was delivered',
    message: `Order #${String(order._id).slice(-6).toUpperCase()} has been marked as delivered. Enjoy!`,
    link: `/order-history/${order._id}`,
  });
