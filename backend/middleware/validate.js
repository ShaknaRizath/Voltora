import mongoose from 'mongoose';

// Use with router.param('id', validateObjectId) so a malformed id is a clean 404, not a 500.
export const validateObjectId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
};

export const pick = (obj = {}, keys = []) =>
  keys.reduce((out, k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
    return out;
  }, {});

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
