import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { removeFromCart, addToCart } from "../redux/cartSlice";
import { API_URL, assetUrl, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Breadcrumbs, EmptyState, PageHeader, Spinner } from "../components/ui";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const [selectedItems, setSelectedItems] = useState(cartItems.map((item) => item._id));
  const [checkingOut, setCheckingOut] = useState(false);

  const updateQuantity = (product, newQty) => {
    if (newQty < 1) return;
    dispatch(addToCart({ ...product, qty: newQty }));
  };

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
    setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
  };

  const toggle = (id) =>
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const toggleAll = () => setSelectedItems(allSelected ? [] : cartItems.map((i) => i._id));

  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item._id));
  const total = selectedCartItems.reduce((sum, item) => sum + item.qty * item.discountPrice, 0);
  const savings = selectedCartItems.reduce((sum, item) => sum + item.qty * (item.price - item.discountPrice), 0);
  const unitCount = selectedCartItems.reduce((n, i) => n + i.qty, 0);

  const handleCheckout = async () => {
    if (selectedCartItems.length === 0) {
      toast.error("Select at least one product to continue.");
      return;
    }
    if (!localStorage.getItem("token")) {
      toast.info("Please sign in to check out.");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setCheckingOut(true);
    try {
      // Only ids and quantities are sent. Prices are always read from the database on the server.
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ items: selectedCartItems.map((i) => ({ _id: i._id, qty: i.qty })) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || data.message || "Payment initiation failed.");
        setCheckingOut(false);
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Shop", to: "/home" }, { label: "Cart" }]} />
      <PageHeader title="Your cart" description={cartItems.length ? `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} in your cart` : undefined} />

      {cartItems.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={
            <Link to="/home" className="btn btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-4 lg:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 px-1 text-sm font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              Select all
            </label>

            {cartItems.map((item) => {
              const selected = selectedItems.includes(item._id);
              return (
                <div
                  key={item._id}
                  className={`card flex gap-4 p-4 transition sm:gap-5 sm:p-5 ${selected ? "" : "opacity-60"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(item._id)}
                    aria-label={`Select ${item.title}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-zinc-100 sm:h-28 sm:w-28">
                    <img src={assetUrl(item.image)} alt={item.title} className="h-full w-full object-contain p-2 mix-blend-multiply" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-zinc-900">{item.title}</h2>
                        <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                          {item.description || "No description available"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item._id)}
                        aria-label={`Remove ${item.title}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="inline-flex items-center rounded-lg ring-1 ring-inset ring-zinc-200">
                        <button
                          className="grid h-9 w-9 place-items-center text-zinc-600 transition hover:text-zinc-900"
                          onClick={() => updateQuantity(item, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="h-4 w-4" />
                        </button>
                        <input
                          value={item.qty}
                          onChange={(e) => updateQuantity(item, Number(e.target.value.replace(/\D/g, "")) || 1)}
                          inputMode="numeric"
                          aria-label="Quantity"
                          className="h-9 w-10 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none"
                        />
                        <button
                          className="grid h-9 w-9 place-items-center text-zinc-600 transition hover:text-zinc-900"
                          onClick={() => updateQuantity(item, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-zinc-900">
                          LKR {(item.discountPrice * item.qty).toLocaleString()}
                        </p>
                        {item.qty > 1 && (
                          <p className="text-xs text-zinc-500">LKR {item.discountPrice.toLocaleString()} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-1">
            <div className="card sticky top-24 p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Items ({unitCount})</dt>
                  <dd className="font-medium">LKR {(total + savings).toLocaleString()}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <dt>Cash discount</dt>
                    <dd className="font-medium">− LKR {savings.toLocaleString()}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-100 pt-4 text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-xl font-bold">LKR {total.toLocaleString()}</dd>
                </div>
              </dl>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || selectedCartItems.length === 0}
                className="btn btn-primary btn-lg mt-6 w-full"
              >
                {checkingOut ? <Spinner className="h-5 w-5" /> : <FiLock className="h-4 w-4" />}
                {checkingOut ? "Redirecting…" : "Checkout"}
              </button>
              <p className="mt-3 text-center text-xs text-zinc-500">Secure payment powered by Stripe</p>
              <Link to="/home" className="mt-5 block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
