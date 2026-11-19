import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus } from "react-icons/fi";
import { addToCart } from "../redux/cartSlice";
import { useToast } from "./Toast";
import { Badge } from "./ui";
import { assetUrl } from "../config";

const CATEGORY_LABEL = { mobile: "Mobile", laptop: "Laptop", accessory: "Accessory" };

export default function ProductCard({ product, onSelect }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const inCart = useSelector((s) => s.cart.cartItems.find((i) => i._id === product._id));

  const hasDiscount = product.price > product.discountPrice;
  const percentOff = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;

  const quickAdd = (e) => {
    e.stopPropagation();
    // cartSlice.addToCart overwrites qty, so send current qty + 1.
    dispatch(addToCart({ ...product, qty: (inCart?.qty || 0) + 1 }));
    toast.success(`${product.title} added to cart`);
  };

  return (
    <article
      onClick={() => onSelect(product)}
      className="group card cursor-pointer overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        <img
          src={assetUrl(product.image)}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105"
        />
        {percentOff > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
            −{percentOff}%
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <Badge>{CATEGORY_LABEL[product.category] || product.category}</Badge>
        <h3 className="mt-2.5 line-clamp-1 text-base font-semibold text-zinc-900">{product.title}</h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-zinc-900">LKR {product.discountPrice?.toLocaleString()}</p>
            {hasDiscount && (
              <p className="text-sm text-zinc-400 line-through">LKR {product.price?.toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.title} to cart`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition hover:bg-brand-600 active:scale-95"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
