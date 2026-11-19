import mongoose from 'mongoose';

// Atomic sequence counters (e.g. repair IDs) so two simultaneous requests can't get the same number.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Returns the next number in a named sequence. On first use the counter is seeded from
 * `seedFn()` (e.g. the highest ID that already exists) so old data isn't clashed with.
 */
export const nextSequence = async (name, seedFn) => {
  if (!(await Counter.exists({ _id: name }))) {
    const start = seedFn ? await seedFn() : 0;
    try {
      await Counter.create({ _id: name, seq: start });
    } catch (err) {
      if (err.code !== 11000) throw err; // someone else created it first: fine
    }
  }
  const counter = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true });
  return counter.seq;
};

export default Counter;
