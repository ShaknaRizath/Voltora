import crypto from 'crypto';
import Warranty from '../models/Warranty.js';
import User from '../models/User.js';
import { pick } from '../middleware/validate.js';

export const DEFAULT_WARRANTY_MONTHS = Number(process.env.WARRANTY_MONTHS) || 12;

// Letters and digits without look-alikes (no 0/O, 1/I) so serials are easy to read out loud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomChars = (n) => Array.from({ length: n }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');

// "VLT-ABCD-EFGH"
export const generateSerial = () => `VLT-${randomChars(4)}-${randomChars(4)}`;

// Lookups ignore case, spaces and dashes: "vlt 7k2q-9xma" finds "VLT-7K2Q-9XMA".
export const serialKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// What the public lookup (and the customer's own list) returns for a warranty.
const present = (w) => {
  const msLeft = new Date(w.expiresAt).getTime() - Date.now();
  return {
    _id: w._id,
    serialNumber: w.serialNumber,
    productName: w.productName,
    purchasedAt: w.purchasedAt,
    expiresAt: w.expiresAt,
    warrantyMonths: w.warrantyMonths,
    order: w.order,
    status: msLeft > 0 ? 'active' : 'expired',
    daysRemaining: Math.max(0, Math.ceil(msLeft / 86_400_000)),
  };
};

/**
 * Called when an order becomes paid: one warranty (with its own serial number) per unit bought.
 * The caller only invokes this the first time an order flips to paid, so it never duplicates.
 */
export const createWarrantiesForOrder = async (order) => {
  const purchasedAt = order.paidAt || new Date();
  const docs = [];
  for (const item of order.items) {
    for (let i = 0; i < (item.qty || 0); i++) {
      const serialNumber = generateSerial();
      docs.push({
        serialNumber,
        serialKey: serialKey(serialNumber),
        productName: item.title,
        product: item.product,
        order: order._id,
        userId: order.userId,
        purchasedAt,
        warrantyMonths: DEFAULT_WARRANTY_MONTHS,
        expiresAt: addMonths(purchasedAt, DEFAULT_WARRANTY_MONTHS),
      });
    }
  }
  if (docs.length) await Warranty.insertMany(docs);
  return docs.length;
};

// GET /api/warranty/lookup/:serial   (public)
export const lookupWarranty = async (req, res, next) => {
  try {
    const key = serialKey(req.params.serial);
    const warranty = key.length >= 4 ? await Warranty.findOne({ serialKey: key }) : null;
    if (!warranty) {
      return res.status(404).json({ message: 'No warranty found for that serial number.' });
    }
    // Deliberately no owner details: anyone with a serial can check coverage, nothing more.
    const { _id, order, ...publicFields } = present(warranty); // eslint-disable-line no-unused-vars
    res.json(publicFields);
  } catch (error) {
    next(error);
  }
};

// GET /api/warranty/mine   (signed in)
export const myWarranties = async (req, res, next) => {
  try {
    const list = await Warranty.find({ userId: req.user.userId }).sort({ purchasedAt: -1 });
    res.json(list.map(present));
  } catch (error) {
    next(error);
  }
};

// POST /api/warranty   (admin) register a unit sold in store
export const adminCreateWarranty = async (req, res, next) => {
  try {
    const body = pick(req.body, ['productName', 'serialNumber', 'purchasedAt', 'warrantyMonths', 'ownerEmail']);
    if (!body.productName) return res.status(400).json({ message: 'Product name is required' });

    const months = body.warrantyMonths === undefined ? DEFAULT_WARRANTY_MONTHS : Number(body.warrantyMonths);
    if (!Number.isInteger(months) || months < 1 || months > 60) {
      return res.status(400).json({ message: 'Warranty length must be 1 to 60 months' });
    }
    const purchasedAt = body.purchasedAt ? new Date(body.purchasedAt) : new Date();
    if (Number.isNaN(purchasedAt.getTime())) return res.status(400).json({ message: 'Invalid purchase date' });

    const serialNumber = (body.serialNumber || generateSerial()).trim();
    if (serialKey(serialNumber).length < 4) return res.status(400).json({ message: 'Serial number is too short' });

    let userId;
    if (body.ownerEmail) {
      const owner = await User.findOne({ email: String(body.ownerEmail).trim().toLowerCase() }).select('_id');
      userId = owner?._id;
    }

    const warranty = await Warranty.create({
      serialNumber,
      serialKey: serialKey(serialNumber),
      productName: body.productName,
      userId,
      purchasedAt,
      warrantyMonths: months,
      expiresAt: addMonths(purchasedAt, months),
    });
    res.status(201).json(present(warranty));
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'That serial number is already registered' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
    next(error);
  }
};
