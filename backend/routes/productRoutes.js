import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { validateObjectId } from "../middleware/validate.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getReviewStatus,
} from "../controllers/productController.js";

const router = express.Router();

router.param("id", validateObjectId);

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/:id/review-status", verifyToken, getReviewStatus);
router.post("/:id/reviews", verifyToken, addProductReview);

// Admin only
router.post("/", verifyToken, isAdmin, createProduct);
router.put("/:id", verifyToken, isAdmin, updateProduct);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default router;
