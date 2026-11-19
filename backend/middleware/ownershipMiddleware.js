import Repair from '../models/Repair.js';

export const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    const isOwner = repair.createdBy && repair.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    req.repair = repair; // saves a second lookup in the controller
    next();
  } catch (error) {
    next(error);
  }
};
