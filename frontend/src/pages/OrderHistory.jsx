import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import { FiDownload, FiPackage, FiSearch } from "react-icons/fi";
import { API_URL, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Badge, EmptyState, PageHeader, Spinner } from "../components/ui";

export default function OrderHistory() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`, { headers: authHeader() });
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Couldn't load your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter((order) => order._id.toLowerCase().includes(searchId.toLowerCase()));

  const orderTotal = (o) => Number(o.total ?? o.totalPrice ?? 0);

  const downloadInvoice = async (order) => {
    const [{ jsPDF }, autoTable] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

    const doc = new jsPDF();
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString();

    doc.setFontSize(16);
    doc.text("Voltora - Order Invoice", 14, 16);
    doc.setFontSize(11);
    doc.text(`Order ID: ${order._id}`, 14, 26);
    doc.text(`Date: ${dateStr}`, 14, 33);
    doc.text(`Status: ${order.isDelivered ? "Delivered" : "Not Delivered"}`, 14, 40);

    const items = (order.items || order.orderItems || []).map((it) => [
      it?.title || it?.name || it?.product?.title || "Item",
      String(it?.qty ?? it?.quantity ?? 1),
      `Rs ${Number(it?.price ?? it?.discountPrice ?? 0).toLocaleString()}`,
      `Rs ${((it?.qty ?? it?.quantity ?? 1) * (it?.price ?? it?.discountPrice ?? 0)).toLocaleString()}`,
    ]);

    autoTable.default(doc, {
      startY: 48,
      head: [["Item", "Qty", "Price", "Line Total"]],
      body: items.length ? items : [["-", "-", "-", "-"]],
    });

    const totalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text(`Total: Rs ${orderTotal(order).toLocaleString()}`, 14, totalY);

    doc.save(`invoice_${order._id}.pdf`);
  };

  const statusBadge = (o) =>
    o.isDelivered ? <Badge tone="green">Delivered</Badge> : <Badge tone="amber">Processing</Badge>;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="My orders"
        description="Track your purchases and download invoices."
        actions={
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search by order ID"
              className="input !w-64 !pl-10"
            />
          </div>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-24 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : needsLogin ? (
        <EmptyState
          icon={FiLogIn}
          title="Sign in to see your orders"
          description="Your orders are tied to your account."
          action={
            <Link to="/login" className="btn btn-primary">
              Sign in
            </Link>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="No orders found"
          description={searchId ? "No order matches that ID." : "You haven't placed any orders yet."}
          action={
            <Link to="/home" className="btn btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="transition hover:bg-zinc-50/70">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-600">#{order._id}</td>
                    <td className="px-6 py-4 text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold">LKR {orderTotal(order).toLocaleString()}</td>
                    <td className="px-6 py-4">{statusBadge(order)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/order-history/${order._id}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                        <button onClick={() => downloadInvoice(order)} className="btn btn-ghost btn-sm">
                          <FiDownload /> Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {filteredOrders.map((order) => (
              <div key={order._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-zinc-500">#{order._id}</p>
                    <p className="mt-1 text-sm text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  {statusBadge(order)}
                </div>
                <p className="mt-3 text-lg font-bold">LKR {orderTotal(order).toLocaleString()}</p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/order-history/${order._id}`} className="btn btn-secondary btn-sm flex-1">
                    Details
                  </Link>
                  <button onClick={() => downloadInvoice(order)} className="btn btn-ghost btn-sm flex-1">
                    <FiDownload /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
