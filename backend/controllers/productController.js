import Product from "../models/productModel.js";
import User from "../models/User.js";
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

// @desc Add a product review (anyone; signed-in users are named after their account)
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

    // A signed-in reviewer can't impersonate someone else.
    let name = String(req.body.name || "Guest").trim().slice(0, 60) || "Guest";
    if (req.user) {
      const user = await User.findById(req.user.userId).select("username");
      if (user) name = user.username;
    }

    product.reviews.push({ name, rating, comment });
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: validationMessage(error) });
    next(error);
  }
};
