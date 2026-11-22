// controllers/repairController.js
import Repair from '../models/Repair.js';
import { nextSequence } from '../models/Counter.js';
import { publicPath, removeUpload } from '../middleware/uploadMiddleware.js';
import { notifyRepairStatus } from '../utils/notify.js';
import { escapeRegex, pick } from '../middleware/validate.js';

const SORTABLE = ['submittedAt', 'createdAt', 'status', 'repairId', 'customerName', 'productName'];

const toBool = (v) => v === true || v === 'true';

const validationMessage = (error) => Object.values(error.errors).map((e) => e.message).join(', ');

// Create a new repair request (any signed-in user)
export const createRepair = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A photo of the damage is required' });
    }

    // Only these fields can come from the client. repairId, status, flags and owner are set here.
    const body = pick(req.body, ['productId', 'customerName', 'productName', 'description']);

    if (await Repair.exists({ productId: body.productId })) {
      removeUpload(req.file);
      return res.status(400).json({ message: 'Product ID already exists' });
    }

    const seq = await nextSequence('repair', async () => {
      const all = await Repair.find({}, 'repairId').lean();
      return all.reduce((max, r) => Math.max(max, parseInt(r.repairId?.match(/(\d+)$/)?.[1] || '0', 10)), 0);
    });

    const repair = await Repair.create({
      ...body,
      repairId: `PR${String(seq).padStart(3, '0')}`,
      damagedImage: publicPath(req.file),
      createdBy: req.user.userId,
      submittedAt: new Date(),
    });

    res.status(201).json(repair);
  } catch (error) {
    removeUpload(req.file); // don't leave orphaned files behind on failure
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: validationMessage(error) });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product ID already exists' });
    }
    next(error);
  }
};

// List repairs with filtering and sorting. Customers see only their own requests;
// admins see everyone's.
export const getAllRepairs = async (req, res, next) => {
  try {
    const q = req.query;
    const filter = {};
    if (req.user.role !== 'admin') filter.createdBy = req.user.userId;

    if (q.repairId) filter.repairId = String(q.repairId);
    if (q.status) filter.status = String(q.status);
    if (q.isConfirmed) filter.isConfirmed = q.isConfirmed === 'true';
    if (q.isValid) filter.isValid = q.isValid === 'true';
    if (q.customerName) filter.customerName = { $regex: escapeRegex(q.customerName), $options: 'i' };
    if (q.productName) filter.productName = { $regex: escapeRegex(q.productName), $options: 'i' };
    if (q.startDate && q.endDate) {
      filter.submittedAt = { $gte: new Date(q.startDate), $lte: new Date(q.endDate) };
    }

    const sortField = SORTABLE.includes(q.sortBy) ? q.sortBy : 'submittedAt';
    const sortOrder = q.order === 'desc' ? -1 : 1;

    // The owner's account id is never exposed in the list.
    const repairs = await Repair.find(filter).select('-createdBy').sort({ [sortField]: sortOrder });
    res.status(200).json(repairs);
  } catch (error) {
    next(error);
  }
};

// Get a single repair. The route's isOwnerOrAdmin check has already run, so only the
// customer who submitted it (or an admin) gets here.
export const getRepairById = (req, res) => {
  res.status(200).json(req.repair);
};

// Public before/after gallery. Shows the work without exposing who it belongs to:
// no customer name, no description and no owner id.
export const getGallery = async (req, res, next) => {
  try {
    const repairs = await Repair.find({ repairedImage: { $exists: true, $ne: '' } })
      .select('repairId productName status damagedImage repairedImage submittedAt')
      .sort({ updatedAt: -1, submittedAt: -1 })
      .limit(100);
    res.status(200).json(repairs);
  } catch (error) {
    next(error);
  }
};

// Owner (or admin) edits their own request: description and damaged photo only.
export const updateRepair = async (req, res, next) => {
  try {
    const repair = req.repair || (await Repair.findById(req.params.id));
    if (!repair) {
      removeUpload(req.file);
      return res.status(404).json({ message: 'Repair not found' });
    }

    const updates = pick(req.body, ['description']);
    if (req.file) updates.damagedImage = publicPath(req.file);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const oldImage = repair.damagedImage;
    repair.set({ ...updates, updatedAt: new Date() });
    await repair.save();
    if (req.file && oldImage) removeUpload(oldImage);

    res.status(200).json(repair);
  } catch (error) {
    removeUpload(req.file);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: validationMessage(error) });
    }
    next(error);
  }
};

// Admin only: status, validity flags and the repaired photo.
export const adminUpdateRepair = async (req, res, next) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      removeUpload(req.file);
      return res.status(404).json({ message: 'Repair not found' });
    }

    const updates = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.isValid !== undefined) updates.isValid = toBool(req.body.isValid);
    if (req.body.isConfirmed !== undefined) updates.isConfirmed = toBool(req.body.isConfirmed);
    if (req.file) updates.repairedImage = publicPath(req.file);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const oldImage = repair.repairedImage;
    const oldStatus = repair.status;
    repair.set({ ...updates, updatedAt: new Date() });
    await repair.save(); // enum validation on status runs here
    if (req.file && oldImage) removeUpload(oldImage);
    if (repair.status !== oldStatus) await notifyRepairStatus(repair); // tell the customer

    res.status(200).json(repair);
  } catch (error) {
    removeUpload(req.file);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: validationMessage(error) });
    }
    next(error);
  }
};

// Delete a repair request (owner or admin) and its photos
export const deleteRepair = async (req, res, next) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Repair not found' });
    removeUpload(repair.damagedImage);
    removeUpload(repair.repairedImage);
    res.status(200).json({ message: 'Repair request deleted' });
  } catch (error) {
    next(error);
  }
};
