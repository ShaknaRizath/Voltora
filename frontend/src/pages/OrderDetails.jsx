import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiAlertTriangle, FiCheck, FiClock, FiDownload, FiShield } from "react-icons/fi";
import WarrantyQR from "../components/WarrantyQR";
import { downloadWarrantyCard } from "../lib/warrantyCard";
import { useToast } from "../components/Toast";
import { API_URL, assetUrl, authHeader } from "../config";
import { Badge, Breadcrumbs, EmptyState, PageLoader } from "../components/ui";

export default function OrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/${id}`, { headers: authHeader() });
        if (!res.ok) throw new Error("Failed to fetch order");
        setOrder(await res.json());
      } catch (err) {
        console.error("Error loading order:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Warranties are created automatically when the order is paid (one per unit).
    fetch(`${API_URL}/api/warranty/mine`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setWarranties(Array.isArray(list) ? list.filter((w) => w.order === id) : []))
      .catch(() => {});
  }, [id]);

  if (loading) return <PageLoader label="Loading order…" />;

  if (!order)
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={FiAlertTriangle}
          title="Order not found"
          description="We couldn't find that order. It may have been removed."
          action={
            <Link to="/order-history" className="btn btn-primary">
              Back to orders
            </Link>
          }
        />
      </div>
    );

  const { _id, items = [], total = 0, isDelivered, createdAt } = order;

  const steps = [
    { label: "Order placed", done: true, detail: new Date(createdAt).toLocaleString() },
    { label: "Processing", done: true, detail: "We're preparing your items" },
    { label: "Delivered", done: Boolean(isDelivered), detail: isDelivered ? "Your order has arrived" : "Pending delivery" },
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Orders", to: "/order-history" }, { label: `#${_id.slice(-8)}` }]} />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Order details</h1>
        {isDelivered ? <Badge tone="green">Delivered</Badge> : <Badge tone="amber">Processing</Badge>}
      </div>
      <p className="-mt-6 mb-8 font-mono text-xs text-zinc-500">#{_id}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <section className="card p-6">
            <h2 className="mb-5 text-lg font-semibold">Status</h2>
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <li key={s.label} className="relative flex gap-4">
                  {i < steps.length - 1 && (
                    <span className={`absolute left-4 top-9 h-[calc(100%-0.25rem)] w-px ${s.done && steps[i + 1].done ? "bg-brand-600" : "bg-zinc-200"}`} />
                  )}
                  <span
                    className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      s.done ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {s.done ? <FiCheck className="h-4 w-4" /> : <FiClock className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${s.done ? "text-zinc-900" : "text-zinc-500"}`}>{s.label}</p>
                    <p className="text-sm text-zinc-500">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Warranty */}
          {warranties.length > 0 && (
            <section className="card p-6">
              <div className="flex items-center gap-2">
                <FiShield className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold">Warranty</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Each item has its own serial number and QR code. Download the card to keep it, or scan it with your phone to check coverage.
              </p>
              <ul className="mt-4 divide-y divide-zinc-100">
                {warranties.map((w) => (
                  <li key={w._id} className="flex items-center gap-4 py-4">
                    <WarrantyQR serial={w.serialNumber} size={72} className="shrink-0 ring-1 ring-zinc-200" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{w.productName}</p>
                      <p className="font-mono text-sm text-zinc-600">{w.serialNumber}</p>
                      <p className="text-xs text-zinc-500">
                        Covered until {new Date(w.expiresAt).toLocaleDateString()} ({w.status === "active" ? `${w.daysRemaining} days left` : "expired"})
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() =>
                          downloadWarrantyCard(w).catch(() => toast.error("Couldn't create the warranty card. Please try again."))
                        }
                        className="btn btn-secondary btn-sm"
                      >
                        <FiDownload /> Download QR
                      </button>
                      <Link to={`/warranty-validate?serial=${encodeURIComponent(w.serialNumber)}`} className="btn btn-secondary btn-sm">
                        Check
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Items */}
          <section className="card p-6">
            <h2 className="mb-2 text-lg font-semibold">Items</h2>
            {items.length === 0 ? (
              <p className="py-6 text-sm text-zinc-500">No items found.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((item, index) => (
                  <li key={index} className="flex items-center gap-4 py-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-zinc-100">
                      <img src={assetUrl(item.image)} alt={item.title} className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{item.title}</p>
                      <p className="text-sm text-zinc-500">
                        {item.qty} × LKR {Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">LKR {(item.qty * (item.price || 0)).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside>
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-semibold">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Placed on</dt>
                <dd>{new Date(createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Items</dt>
                <dd>{items.reduce((n, i) => n + (i.qty || 0), 0)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-4 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="text-xl font-bold">LKR {Number(total).toLocaleString()}</dd>
              </div>
            </dl>
            <Link to="/order-history" className="btn btn-secondary mt-6 w-full">
              Back to orders
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
