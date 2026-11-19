import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiDownload, FiSearch, FiShield } from "react-icons/fi";
import { API_URL, authHeader } from "../config";
import { downloadWarrantyCard } from "../lib/warrantyCard";
import { useToast } from "../components/Toast";
import WarrantyQR from "../components/WarrantyQR";
import { Badge, EmptyState, PageHeader, PageLoader } from "../components/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
];

const fmt = (d) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function MyWarranties() {
  const toast = useToast();
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/warranty/mine`, { headers: authHeader() });
        if (res.status === 401) return setSessionExpired(true);
        const data = await res.json();
        setWarranties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load your warranties.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      all: warranties.length,
      active: warranties.filter((w) => w.status === "active").length,
      expired: warranties.filter((w) => w.status === "expired").length,
    }),
    [warranties]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warranties.filter(
      (w) =>
        (filter === "all" || w.status === filter) &&
        (!q || w.productName.toLowerCase().includes(q) || w.serialNumber.toLowerCase().includes(q))
    );
  }, [warranties, filter, query]);

  const handleDownload = (w) =>
    downloadWarrantyCard(w).catch(() => toast.error("Couldn't create the warranty card. Please try again."));

  if (loading) return <PageLoader label="Loading your warranties…" />;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="My warranties"
        description="Every device you've bought from Voltora, with its serial number and coverage."
        actions={
          <Link to="/warranty-validate" className="btn btn-secondary">
            <FiShield /> Check a serial number
          </Link>
        }
      />

      {sessionExpired ? (
        <EmptyState
          icon={FiShield}
          title="Please sign in again"
          description="Your session has expired. Sign in to see your warranties."
          action={
            <Link to="/login" className="btn btn-primary">
              Sign in
            </Link>
          }
        />
      ) : warranties.length === 0 ? (
        <EmptyState
          icon={FiShield}
          title="No warranties yet"
          description="Every item you buy comes with its own warranty. It will appear here once your order is paid."
          action={
            <Link to="/home" className="btn btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === f.key
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:text-zinc-900"
                  }`}
                >
                  {f.label} <span className={filter === f.key ? "text-zinc-400" : "text-zinc-400"}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product or serial"
                className="input !rounded-full !pl-10"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={FiSearch} title="No warranties match" description="Try a different filter or search term." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {visible.map((w) => {
                const active = w.status === "active";
                const expiringSoon = active && w.daysRemaining <= 30;
                const percentLeft = active
                  ? Math.min(100, Math.round((w.daysRemaining / (w.warrantyMonths * 30.4)) * 100))
                  : 0;

                return (
                  <article key={w._id} className="card flex flex-col p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <WarrantyQR serial={w.serialNumber} size={88} className="shrink-0 ring-1 ring-zinc-200" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="truncate text-lg font-semibold">{w.productName}</h2>
                          <Badge tone={!active ? "red" : expiringSoon ? "amber" : "brand"} className="shrink-0">
                            {!active ? "Expired" : expiringSoon ? "Expiring soon" : "Active"}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-sm text-zinc-600">{w.serialNumber}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Purchased {fmt(w.purchasedAt)} · {active ? `Expires ${fmt(w.expiresAt)}` : `Expired ${fmt(w.expiresAt)}`}
                        </p>
                      </div>
                    </div>

                    {active && (
                      <div className="mt-5">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-semibold text-zinc-900">
                            {w.daysRemaining} day{w.daysRemaining === 1 ? "" : "s"} remaining
                          </span>
                          <span className="text-zinc-500">{percentLeft}% left</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${expiringSoon ? "bg-amber-500" : "bg-brand-600"}`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                      <button onClick={() => handleDownload(w)} className="btn btn-secondary btn-sm">
                        <FiDownload /> Download QR
                      </button>
                      <Link to={`/warranty-validate?serial=${encodeURIComponent(w.serialNumber)}`} className="btn btn-secondary btn-sm">
                        Check
                      </Link>
                      {w.order && (
                        <Link to={`/order-history/${w.order}`} className="btn btn-ghost btn-sm ml-auto">
                          View order
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
