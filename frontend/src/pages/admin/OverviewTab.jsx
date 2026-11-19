import React from "react";
import { FiBox, FiPackage, FiShield, FiTool, FiTrendingUp, FiTruck, FiUsers } from "react-icons/fi";
import { formatLKR } from "../../config";
import { PageLoader } from "../../components/ui";
import { fmtDate, shortId, useFetch } from "./utils";

const STATUSES = ["Pending", "Approved", "In Progress", "Resolved", "Rejected"];

const Tile = ({ icon: Icon, label, value, hint }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm text-zinc-500">{label}</p>
      <Icon className="h-5 w-5 text-zinc-900" strokeWidth={1.4} aria-hidden="true" />
    </div>
    <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
  </div>
);

const shortDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export default function OverviewTab() {
  const { data: s, loading } = useFetch("/api/admin/stats");
  if (loading || !s) return <PageLoader label="Loading overview…" />;

  const max = Math.max(1, ...s.series.map((d) => d.revenue));
  const weekRevenue = s.series.slice(-7).reduce((n, d) => n + d.revenue, 0);
  const openRepairs = (s.repairs.Pending || 0) + (s.repairs.Approved || 0) + (s.repairs["In Progress"] || 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={FiTrendingUp} label="Revenue" value={formatLKR(s.revenue)} hint={`${formatLKR(weekRevenue)} in the last 7 days`} />
        <Tile icon={FiPackage} label="Paid orders" value={s.paidOrders} hint={`${s.toDeliver} waiting for delivery`} />
        <Tile icon={FiTool} label="Open repairs" value={openRepairs} hint={`${s.repairsTotal} repairs in total`} />
        <Tile icon={FiShield} label="Active warranties" value={s.warrantiesActive} hint={`${s.warrantiesTotal} registered`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Revenue, last 14 days</h2>
            <p className="text-xs text-zinc-500">Peak {formatLKR(max === 1 ? 0 : max)}</p>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5" role="img" aria-label="Daily revenue for the last 14 days">
            {s.series.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md transition-colors ${d.revenue ? "bg-zinc-900 group-hover:bg-brand-600" : "bg-zinc-200"}`}
                  style={{ height: `${d.revenue ? Math.max(4, (d.revenue / max) * 100) : 2}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white group-hover:block">
                  {shortDay(d.date)}: {formatLKR(d.revenue)} ({d.orders} {d.orders === 1 ? "order" : "orders"})
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>{shortDay(s.series[0].date)}</span>
            <span>{shortDay(s.series[s.series.length - 1].date)}</span>
          </div>
        </section>

        {/* Repairs by status */}
        <section className="card p-6">
          <h2 className="text-base font-semibold">Repairs by status</h2>
          <ul className="mt-5 space-y-4">
            {STATUSES.map((st) => {
              const n = s.repairs[st] || 0;
              return (
                <li key={st}>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">{st}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-zinc-900" style={{ width: `${s.repairsTotal ? (n / s.repairsTotal) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-semibold">Best sellers</h2>
          {s.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No sales yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-zinc-100">
              {s.topProducts.map((p, i) => (
                <li key={p.title} className="flex items-center gap-4 py-3 text-sm">
                  <span className="w-5 text-zinc-400">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.title}</span>
                  <span className="text-zinc-500">{p.units} sold</span>
                  <span className="w-28 text-right font-semibold">{formatLKR(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold">Recent orders</h2>
          {s.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {s.recentOrders.map((o) => (
                <li key={o._id} className="flex items-center gap-4 py-3 text-sm">
                  <span className="font-mono text-xs font-semibold">{shortId(o._id)}</span>
                  <span className="flex-1 truncate text-zinc-600">{o.customer}</span>
                  <span className="text-zinc-500">{fmtDate(o.createdAt)}</span>
                  <span className="w-28 text-right font-semibold">{formatLKR(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile icon={FiUsers} label="Customers" value={s.users} />
        <Tile icon={FiBox} label="Products" value={s.products} />
        <Tile icon={FiTruck} label="To deliver" value={s.toDeliver} />
      </div>
    </div>
  );
}
