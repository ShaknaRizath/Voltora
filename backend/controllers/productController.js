import Product from "../models/productModel.js";
import User from "../models/User.js";
import Order from "../models/orderModel.js";
import { pick } from "../middleware/validate.js";
import { removeUpload } from "../middleware/uploadMiddleware.js";
import { ORDER_SORT, compactOrder, ensureOrder, nextPosition } from "../utils/productOrder.js";

const FIELDS = ["title", "image", "price", "discountPrice", "category", "description"];

const validationMessage = (error) => Object.values(error.errors).map((e) => e.message).join(", ");

// @desc Get all products
// @route GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    await ensureOrder();
    res.json(await Product.find({}).sort(ORDER_SORT));
  } catch (error) {
    next(error);
  }
};

// @desc Get single product by ID
// @route GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc Create new product (admin)
// @route POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const data = pick(req.body, FIELDS);
    if (Number(data.discountPrice) > Number(data.price)) {
      return res.status(400).json({ message: "Sale price can't be higher than the regular price" });
    }
    // New products go to the end of the list; the admin can move them afterwards.
    const product = await Product.create({ ...data, reviews: [], sortOrder: await nextPosition() });
    res.status(201).json(product);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: validationMessage(error) });
    next(error);
  }
};

// @desc Update a product (admin)
// @route PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const oldImage = product.image;
    product.set(pick(req.body, FIELDS));
    if (product.discountPrice > product.price) {
      return res.status(400).json({ message: "Sale price can't be higher than the regular price" });
    }
    await product.save();
    // Clean up a replaced admin upload (seed images live in the frontend and are never touched).
    if (oldImage !== product.image && oldImage?.startsWith("uploads/")) removeUpload(oldImage);
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: validationMessage(error) });
    next(error);
  }
};

// @desc Delete a product (admin)
// @route DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.image?.startsWith("uploads/")) removeUpload(product.image);
    await compactOrder();
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

// Reviews are for customers who actually received the product (a paid order that was marked delivered),
// one review each.
const reviewStatus = async (product, userId) => {
  if (product.reviews.some((r) => String(r.userId) === String(userId))) return "reviewed";
  const delivered = await Order.exists({ userId, isPaid: true, isDelivered: true, "items.product": product._id });
  return delivered ? "ok" : "not_delivered";
};

// @desc Can the signed-in customer review this product?
// @route GET /api/products/:id/review-status   -> { status: "ok" | "not_delivered" | "reviewed" }
export const getReviewStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id, "reviews");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ status: await reviewStatus(product, req.user.userId) });
  } catch (error) {
    next(error);
  }
};

// @desc Add a product review (signed-in customers who received the product)
// @route POST /api/products/:id/reviews
export const addProductReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (!comment) return res.status(400).json({ message: "Please write a comment" });

    const status = await reviewStatus(product, req.user.userId);
    if (status === "reviewed") return res.status(409).json({ message: "You have already reviewed this product" });
    if (status !== "ok") return res.status(403).json({ message: "Only customers who have received this product can review it" });

    const user = await User.findById(req.user.userId).select("username");
    product.reviews.push({ name: user?.username || "Customer", rating, comment, userId: req.user.userId, verified: true });
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: validationMessage(error) });
    next(error);
  }
};
