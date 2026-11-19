import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiGrid, FiPackage, FiSearch, FiShield, FiShoppingBag, FiTool, FiUser } from "react-icons/fi";
import { API_URL, getRole, legacyAuthHeader } from "../config";
import { PageLoader } from "../components/ui";

const adminAction = { to: "/admin", icon: FiGrid, title: "Admin", text: "Manage products, orders, repairs, warranties and customers" };

const actions = [
  { to: "/home", icon: FiShoppingBag, title: "Shop", text: "Browse phones, laptops and accessories" },
  { to: "/order-history", icon: FiPackage, title: "My orders", text: "Track purchases and download invoices" },
  { to: "/repair", icon: FiTool, title: "Repairs", text: "Submit and follow repair requests" },
  { to: "/my-warranties", icon: FiShield, title: "My warranties", text: "Serial numbers, QR codes and coverage for your devices" },
  { to: "/warranty-validate", icon: FiSearch, title: "Warranty check", text: "Check any serial number or QR code" },
  { to: "/profile", icon: FiUser, title: "Profile", text: "Update your details and password" },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/profile`, { headers: legacyAuthHeader() });
        setUser(res.data);
      } catch (err) {
        console.error(err.response?.data || err.message);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (!user) return null;

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 text-white sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-brand-600/50 blur-[100px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {user.profileImage ? (
              <img src={user.profileImage} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-2xl font-semibold uppercase ring-2 ring-white/20">
                {user.username?.[0]}
              </span>
            )}
            <div>
              <p className="text-sm text-zinc-400">Welcome back</p>
              <h1 className="text-3xl font-bold sm:text-4xl">{user.username}</h1>
              {user.email && <p className="mt-1 text-sm text-zinc-400">{user.email}</p>}
            </div>
          </div>
          <Link to="/profile" className="btn bg-white text-zinc-900 hover:bg-zinc-100">
            Edit profile
          </Link>
        </div>
      </section>

      {/* Quick actions */}
      <h2 className="mb-5 mt-12 text-xl font-semibold">Quick actions</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(getRole() === "admin" ? [adminAction, ...actions] : actions).map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="group card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <Icon className="h-9 w-9 text-zinc-900" strokeWidth={1.25} aria-hidden="true" />
            <h3 className="mt-6 text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
