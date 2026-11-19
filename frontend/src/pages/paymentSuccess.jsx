import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheck } from "react-icons/fi";
import { API_URL, authHeader } from "../config";
import { clearCart } from "../redux/cartSlice";
import { Spinner } from "../components/ui";

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking"); // checking | paid | pending | error

  // Ask the server whether Stripe really received the payment. The cart is only emptied once it did.
  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    const confirm = async (attempt = 0) => {
      try {
        const res = await fetch(`${API_URL}/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`, {
          headers: authHeader(),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.paid) {
          dispatch(clearCart());
          setStatus("paid");
        } else if (res.ok && attempt < 4) {
          setTimeout(() => confirm(attempt + 1), 1500); // Stripe can take a moment to settle
        } else {
          setStatus(res.ok ? "pending" : "error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    confirm();
    return () => {
      cancelled = true;
    };
  }, [sessionId, dispatch]);

  const view = {
    checking: { title: "Confirming your payment…", text: "This only takes a moment." },
    paid: {
      title: "Payment successful",
      text: "Thank you for your purchase! Your order is now being processed. You can follow it any time from your orders page.",
    },
    pending: {
      title: "Payment still processing",
      text: "We haven't received confirmation from the bank yet. Your order will appear in your orders page as soon as it's confirmed.",
    },
    error: {
      title: "We couldn't confirm this payment",
      text: "If you were charged, your order will show up in your orders page shortly. Otherwise you can safely try again from your cart.",
    },
  }[status];

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="card w-full max-w-lg p-10 text-center">
        {status === "checking" ? (
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-zinc-100 text-zinc-500">
            <Spinner className="h-8 w-8" />
          </span>
        ) : status === "paid" ? (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60"
          >
            <FiCheck className="h-10 w-10" strokeWidth={3} />
          </motion.span>
        ) : (
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/60">
            <FiAlertCircle className="h-10 w-10" />
          </span>
        )}

        <h1 className="mt-6 text-3xl font-bold">{view.title}</h1>
        <p className="mt-3 text-zinc-500">{view.text}</p>

        {status !== "checking" && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/order-history" className="btn btn-primary">
              View my orders
            </Link>
            <Link to={status === "error" ? "/cart" : "/home"} className="btn btn-secondary">
              {status === "error" ? "Back to cart" : "Continue shopping"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
