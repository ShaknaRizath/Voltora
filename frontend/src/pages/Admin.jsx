import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { FiBox, FiGrid, FiLock, FiPackage, FiShield, FiTool, FiUsers } from "react-icons/fi";
import { getRole } from "../config";
import useBadges from "../hooks/useBadges";
import { Count } from "../components/Header";
import { EmptyState, PageHeader } from "../components/ui";
import OverviewTab from "./admin/OverviewTab";
import ProductsTab from "./admin/ProductsTab";
import OrdersTab from "./admin/OrdersTab";
import RepairsTab from "./admin/RepairsTab";
import WarrantiesTab from "./admin/WarrantiesTab";
import CustomersTab from "./admin/CustomersTab";

const TABS = [
  { key: "overview", label: "Overview", icon: FiGrid, Component: OverviewTab },
  { key: "products", label: "Products", icon: FiBox, Component: ProductsTab },
  { key: "orders", label: "Orders", icon: FiPackage, Component: OrdersTab },
  { key: "repairs", label: "Repairs", icon: FiTool, Component: RepairsTab },
  { key: "warranties", label: "Warranties", icon: FiShield, Component: WarrantiesTab },
  { key: "customers", label: "Customers", icon: FiUsers, Component: CustomersTab },
];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const role = getRole();
  const { pendingRepairs, toDeliver } = useBadges();
  const badges = { repairs: pendingRepairs, orders: toDeliver };

  if (!role) return <Navigate to="/login" replace />;

  // UI guard only: every admin API call is also checked on the server.
  if (role !== "admin") {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={FiLock}
          title="Admins only"
          description="This area is for Voltora staff. If you should have access, ask an admin to upgrade your account, then sign in again."
          action={
            <Link to="/dashboard" className="btn btn-primary">
              Back to dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const active = TABS.find((t) => t.key === params.get("tab")) || TABS[0];
  const { Component } = active;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader eyebrow="Admin" title="Manage Voltora" description="Products, orders, repairs, warranties and customers in one place." />

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Admin sections">
        <div className="inline-flex gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const on = key === active.key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={on}
                onClick={() => setParams(key === "overview" ? {} : { tab: key })}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition duration-150 ${
                  on ? "bg-white text-zinc-900 shadow-soft" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {label}
                <Count n={badges[key]} />
              </button>
            );
          })}
        </div>
      </div>

      <Component key={active.key} />
    </div>
  );
}
