import express from "express";
import { verifyToken, optionalAuth, isAdmin } from "../middleware/authMiddleware.js";
import { validateObjectId } from "../middleware/validate.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
} from "../controllers/productController.js";

const router = express.Router();

router.param("id", validateObjectId);

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", optionalAuth, addProductReview);

// Admin only
router.post("/", verifyToken, isAdmin, createProduct);
router.put("/:id", verifyToken, isAdmin, updateProduct);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default router;
