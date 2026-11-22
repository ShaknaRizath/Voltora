import mongoose from "mongoose";

// 💬 Review Schema
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    rating: { type: Number, required: true, min: [1, "Rating must be between 1 and 5"], max: [5, "Rating must be between 1 and 5"] },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    // Set when the review comes from a customer whose order of this product was delivered.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Who wrote a review stays private: the public only sees the display name.
reviewSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.userId;
    return ret;
  },
});

// 📦 Product Schema
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, required: true }, // Can be URL or Base64
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ["mobile", "laptop", "accessory"] },
    description: { type: String, maxlength: 2000 },
    // Display position in the shop (1 = first). Managed by the admin page, see utils/productOrder.js.
    sortOrder: { type: Number, index: true },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
