import React, { useMemo, useState } from "react";
import axios from "axios";
import { FiCheck, FiEye, FiPackage, FiRotateCcw } from "react-icons/fi";
import { API_URL, assetUrl, authHeader, formatLKR } from "../../config";
import { useToast } from "../../components/Toast";
import { Select } from "../../components/inputs";
import { Badge, Modal } from "../../components/ui";
import { IconButton, NothingHere, SearchBox, TableCard, Td, Toolbar } from "./shared";
import { fmtDate, shortId, useFetch } from "./utils";
import { refreshBadges } from "../../hooks/useBadges";

const DeliveryBadge = ({ order }) =>
  !order.isPaid ? (
    <Badge tone="amber">Awaiting payment</Badge>
  ) : order.isDelivered ? (
    <Badge tone="dark">Delivered</Badge>
  ) : (
    <Badge tone="amber">To deliver</Badge>
  );

const customerName = (o) => o.customer?.name || o.customer?.username || "Guest";

function OrderDetail({ order }) {
  return (
    <div className="p-6 sm:p-8">
      <h3 className="pr-10 text-xl font-semibold">Order {shortId(order._id)}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Placed {fmtDate(order.createdAt)}
        {order.paidAt && `, paid ${fmtDate(order.paidAt)}`}
        {order.deliveredAt && `, delivered ${fmtDate(order.deliveredAt)}`}
      </p>

      <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm ring-1 ring-zinc-200">
        <p className="font-semibold">{customerName(order)}</p>
        {order.customer ? (
          <>
            <p className="text-zinc-600">{order.customer.email}</p>
            <p className="text-zinc-600">{order.customer.mobile}</p>
          </>
        ) : (
          <p className="text-zinc-500">This account no longer exists.</p>
        )}
      </div>

      <ul className="mt-5 divide-y divide-zinc-100">
        {order.items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 py-3 text-sm">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              <img src={assetUrl(it.image)} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{it.title}</span>
              <span className="text-zinc-500">
                {it.qty} x {formatLKR(it.price)}
              </span>
            </span>
            <span className="font-semibold">{formatLKR(it.qty * it.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-zinc-200 pt-4 text-base font-semibold">
        <span>Total</span>
        <span>{formatLKR(order.total)}</span>
      </div>
    </div>
  );
}

export default function OrdersTab() {
  const toast = useToast();
  const [status, setStatus] = useState("paid");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { data, setData, loading } = useFetch("/api/admin/orders", { status });

  const orders = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (o) =>
        !term ||
        o._id.toLowerCase().includes(term) ||
        customerName(o).toLowerCase().includes(term) ||
        (o.customer?.email || "").toLowerCase().includes(term)
    );
  }, [data, q]);

  const toggleDelivered = async (order) => {
    setBusyId(order._id);
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/orders/${order._id}/delivered`,
        { delivered: !order.isDelivered },
        { headers: authHeader() }
      );
      setData((list) => list.map((o) => (o._id === order._id ? { ...o, ...res.data } : o)));
      toast.success(res.data.isDelivered ? "Marked as delivered" : "Marked as not delivered");
      refreshBadges();
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't update the order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search by order ID, customer or email" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52">
          <option value="paid">Paid orders</option>
          <option value="unpaid">Awaiting payment</option>
          <option value="all">All orders</option>
        </Select>
      </Toolbar>

      <TableCard
        loading={loading}
        count={orders.length}
        headers={["Order", "Customer", "Items", "Total", "Date", "Status", "Actions"]}
        empty={<NothingHere icon={FiPackage} title="No orders found" description="Orders appear here after checkout." />}
      >
        {orders.map((o) => (
          <tr key={o._id} className="transition hover:bg-zinc-50/70">
            <Td className="font-mono text-xs font-semibold">{shortId(o._id)}</Td>
            <Td>
              <p className="font-medium">{customerName(o)}</p>
              {o.customer?.email && <p className="text-xs text-zinc-500">{o.customer.email}</p>}
            </Td>
            <Td className="text-zinc-600">{o.items.reduce((n, i) => n + i.qty, 0)}</Td>
            <Td className="font-semibold">{formatLKR(o.total)}</Td>
            <Td className="text-zinc-600">{fmtDate(o.createdAt)}</Td>
            <Td>
              <DeliveryBadge order={o} />
            </Td>
            <Td>
              <div className="flex justify-end gap-1">
                <IconButton title="View details" onClick={() => setViewing(o)}>
                  <FiEye />
                </IconButton>
                {o.isPaid && (
                  <IconButton
                    title={o.isDelivered ? "Mark as not delivered" : "Mark as delivered"}
                    disabled={busyId === o._id}
                    onClick={() => toggleDelivered(o)}
                  >
                    {o.isDelivered ? <FiRotateCcw /> : <FiCheck />}
                  </IconButton>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth="max-w-xl" label="Order details">
        {viewing && <OrderDetail order={viewing} />}
      </Modal>
    </>
  );
}
