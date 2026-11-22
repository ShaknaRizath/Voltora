import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { FiCheck, FiMinus, FiPlus, FiShoppingBag, FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { API_URL, assetUrl, authHeader } from "../config";
import { addToCart } from "../redux/cartSlice";
import { useToast } from "./Toast";
import { Badge, Modal, Spinner } from "./ui";

const Stars = ({ value, size = "h-4 w-4" }) => (
  <span className="inline-flex gap-0.5 text-amber-400">
    {[1, 2, 3, 4, 5].map((i) => (
      <FaStar key={i} className={`${size} ${i <= Math.round(value) ? "" : "text-zinc-200"}`} />
    ))}
  </span>
);

export default function ProductModel({ product, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const [count, setCount] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [posting, setPosting] = useState(false);
  // Who may review: "loading" | "guest" | "ok" | "not_delivered" | "reviewed"
  const [reviewState, setReviewState] = useState("loading");

  useEffect(() => {
    setReviews(product?.reviews || []);
    setCount(1);
  }, [product]);

  // Only customers who received this product can review it, so ask the server.
  useEffect(() => {
    if (!product?._id) return;
    if (!localStorage.getItem("token")) {
      setReviewState("guest");
      return;
    }
    let cancelled = false;
    setReviewState("loading");
    fetch(`${API_URL}/api/products/${product._id}/review-status`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setReviewState(d.status))
      .catch(() => !cancelled && setReviewState("not_delivered"));
    return () => {
      cancelled = true;
    };
  }, [product?._id]);

  const average = useMemo(
    () => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews]
  );

  const handleCountChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setCount(value === "" ? "" : Math.max(1, Number(value)));
  };

  const handleAddReview = async () => {
    if (!newReview.trim() || newRating === 0) {
      toast.error("Add a star rating and a short comment first.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${product._id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ comment: newReview.trim(), rating: newRating }),
      });
      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated.message || "Failed to post review");
      setReviews(updated.reviews || []);
      setReviewState("reviewed");
      setNewReview("");
      setNewRating(0);
      setHoverRating(0);
      toast.success("Thanks for your review!");
    } catch (err) {
      toast.error(err.message || "Couldn't post your review. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({ ...product, qty: Number(count || 1) }));
    toast.success(`${product.title} added to cart`);
    onClose();
  };

  const hasDiscount = product && product.price > product.discountPrice;

  return (
    <Modal open={Boolean(product)} onClose={onClose} maxWidth="max-w-5xl" label={product?.title}>
      {product && (
        <div>
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative bg-zinc-100 p-6 sm:p-10">
              <img
                src={assetUrl(product.image)}
                alt={product.title}
                className="mx-auto aspect-square w-full max-w-md object-contain mix-blend-multiply"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col p-6 sm:p-10">
              <Badge tone="brand" className="w-fit capitalize">
                {product.category}
              </Badge>
              <h2 className="mt-3 pr-8 text-2xl font-bold text-zinc-900 sm:text-3xl">{product.title}</h2>

              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <Stars value={average} />
                <span>
                  {reviews.length ? `${average.toFixed(1)} · ${reviews.length} review${reviews.length > 1 ? "s" : ""}` : "No reviews yet"}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-zinc-900">LKR {product.discountPrice?.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-base text-zinc-400 line-through">LKR {product.price?.toLocaleString()}</span>
                )}
              </div>

              {product.description && <p className="mt-5 leading-relaxed text-zinc-600">{product.description}</p>}

              <div className="mt-auto pt-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-xl ring-1 ring-inset ring-zinc-200">
                    <button
                      className="grid h-11 w-11 place-items-center text-zinc-600 transition hover:text-zinc-900"
                      onClick={() => setCount((c) => Math.max(1, Number(c || 1) - 1))}
                      aria-label="Decrease quantity"
                    >
                      <FiMinus />
                    </button>
                    <input
                      value={count}
                      onChange={handleCountChange}
                      onBlur={() => !count && setCount(1)}
                      inputMode="numeric"
                      aria-label="Quantity"
                      className="h-11 w-12 border-0 bg-transparent text-center text-base font-semibold focus:outline-none"
                    />
                    <button
                      className="grid h-11 w-11 place-items-center text-zinc-600 transition hover:text-zinc-900"
                      onClick={() => setCount((c) => Number(c || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <button onClick={handleAddToCart} className="btn btn-primary btn-lg flex-1">
                    <FiShoppingBag className="h-5 w-5" /> Add to cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="border-t border-zinc-100 p-6 sm:p-10">
            <h3 className="text-xl font-semibold text-zinc-900">Customer reviews</h3>

            <div className="mt-6 grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                {reviews.length === 0 ? (
                  <p className="rounded-2xl bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                    No reviews yet.
                  </p>
                ) : (
                  <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {reviews.map((r, idx) => (
                      <li key={idx} className="rounded-2xl bg-zinc-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            {r.name}
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 text-xs font-normal text-zinc-500">
                                <FiCheck className="h-3 w-3" /> Verified buyer
                              </span>
                            )}
                          </p>
                          <Stars value={r.rating} size="h-3.5 w-3.5" />
                        </div>
                        <p className="mt-1.5 text-sm text-zinc-600">{r.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="lg:col-span-2">
                {reviewState === "ok" ? (
                  <>
                    <p className="mb-2 text-sm font-medium text-zinc-700">Write a review</p>
                    <div className="mb-3 flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          aria-label={`${v} star${v > 1 ? "s" : ""}`}
                          onMouseEnter={() => setHoverRating(v)}
                          onClick={() => setNewRating(v)}
                          className="p-0.5"
                        >
                          <FiStar
                            className={`h-6 w-6 transition ${
                              v <= (hoverRating || newRating) ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="What did you think of this product?"
                      rows={3}
                      className="input resize-none"
                    />
                    <button onClick={handleAddReview} disabled={posting} className="btn btn-secondary mt-3">
                      {posting && <Spinner className="h-4 w-4" />} Post review
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-600">
                    <p className="font-medium text-zinc-900">Write a review</p>
                    {reviewState === "loading" && <p className="mt-1">Checking your orders...</p>}
                    {reviewState === "guest" && (
                      <p className="mt-1">
                        Only customers who received this product can review it.{" "}
                        <Link to="/login" state={{ from: "/home" }} className="font-semibold text-zinc-900 underline">
                          Sign in
                        </Link>{" "}
                        to check.
                      </p>
                    )}
                    {reviewState === "not_delivered" && (
                      <p className="mt-1">Only customers who received this product can review it. You can review it once your order is delivered.</p>
                    )}
                    {reviewState === "reviewed" && <p className="mt-1">You have reviewed this product. Thank you!</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
