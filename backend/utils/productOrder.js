// Display order of the products. Every product has a unique position 1..n and the shop
// lists them lowest first. Products created before this existed get numbered automatically.
import Product from '../models/productModel.js';

export const ORDER_SORT = { sortOrder: 1, createdAt: 1, _id: 1 };

// Numbers any products that don't have a position yet (oldest first, after the numbered ones).
export const ensureOrder = async () => {
  if (!(await Product.exists({ sortOrder: { $exists: false } }))) return;
  const all = await Product.find({}, '_id sortOrder createdAt').lean();
  all.sort((a, b) => {
    const an = a.sortOrder ?? Infinity;
    const bn = b.sortOrder ?? Infinity;
    if (an !== bn) return an < bn ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt) || String(a._id).localeCompare(String(b._id));
  });
  await writeOrder(all);
};

const writeOrder = async (list) => {
  if (!list.length) return [];
  await Product.bulkWrite(
    list.map((p, i) => ({ updateOne: { filter: { _id: p._id }, update: { $set: { sortOrder: i + 1 } } } })),
    { timestamps: false }
  );
  return list.map((p, i) => ({ _id: p._id, sortOrder: i + 1 }));
};

// The next free position (for a newly created product).
export const nextPosition = async () => {
  await ensureOrder();
  const last = await Product.findOne({}, 'sortOrder').sort({ sortOrder: -1 }).lean();
  return (last?.sortOrder || 0) + 1;
};

// Moves one product to `position` and shifts the others, so numbers stay unique (1..n).
// Returns the new { _id, sortOrder } list, or null if the product doesn't exist.
export const moveProduct = async (id, position) => {
  await ensureOrder();
  const list = await Product.find({}, '_id').sort(ORDER_SORT).lean();
  const from = list.findIndex((p) => String(p._id) === String(id));
  if (from < 0) return null;
  const [item] = list.splice(from, 1);
  const to = Math.min(Math.max(1, position), list.length + 1) - 1;
  list.splice(to, 0, item);
  return writeOrder(list);
};

// After a product is deleted, close the gap so positions stay 1..n.
export const compactOrder = async () => {
  const list = await Product.find({}, '_id').sort(ORDER_SORT).lean();
  await writeOrder(list);
};
