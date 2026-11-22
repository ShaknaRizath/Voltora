import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowRight, FiBell, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { API_URL, getRole } from "../config";
import Logo from "./Logo";
import useClickOutside from "../hooks/useClickOutside";
import useBadges, { markAllRead, markRead, markSeen, refreshBadges } from "../hooks/useBadges";

// Small count bubble used on the nav, the bell and the admin links.
export const Count = ({ n, className = "" }) =>
  n > 0 ? (
    <span className={`inline-grid h-4 min-w-[1rem] place-items-center rounded-full bg-zinc-950 px-1 text-[10px] font-semibold leading-none text-white ${className}`}>
      {n > 9 ? "9+" : n}
    </span>
  ) : null;

const ago = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */
const NAV = [
  { key: "store", label: "Store", to: "/home", match: (p, h) => p === "/home" && !h },
  { key: "phones", label: "Phones", to: "/home#mobile", match: (p, h) => p === "/home" && h === "#mobile" },
  { key: "laptops", label: "Laptops", to: "/home#laptop", match: (p, h) => p === "/home" && h === "#laptop" },
  { key: "audio", label: "Audio", to: "/home#accessories", match: (p, h) => p === "/home" && h === "#accessories" },
  {
    key: "care",
    label: "Care & Repair",
    to: "/repair",
    match: (p) => p.startsWith("/repair") || p === "/view-repair-images",
  },
  { key: "warranty", label: "Warranty", to: "/warranty-validate", match: (p) => p === "/warranty-validate" },
];

const QUICK = [
  { label: "Cart", to: "/cart" },
  { label: "My orders", to: "/order-history" },
  { label: "Warranty check", to: "/warranty-validate" },
];

const SEARCH_QUICK = [
  { label: "Phones", to: "/home#mobile" },
  { label: "Laptops", to: "/home#laptop" },
  { label: "Audio", to: "/home#accessories" },
  { label: "Repair centre", to: "/repair" },
  { label: "Warranty check", to: "/warranty-validate" },
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const iconBtn =
  "relative grid h-11 w-9 place-items-center text-zinc-800/80 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:text-brand-600";
const iconCls = "h-[17px] w-[17px]";

export default function Header() {
  const [openKey, setOpenKey] = useState(null); // nav key | "search" | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [snap, setSnap] = useState(null); // what was new when the bell was opened, kept while it stays open
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(readUser);
  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { unread, items: notes, pendingRepairs, toDeliver } = useBadges();
  const isAdmin = getRole() === "admin";
  // Admins see how many repair requests are waiting. Customers see their unread repair updates.
  const bellCount = unread + (isAdmin ? pendingRepairs + toDeliver : 0);
  const careCount = isAdmin ? pendingRepairs : notes.filter((n) => !n.read && n.type === "repair").length;

  const cartCount = useSelector((s) => s.cart.cartItems.reduce((n, i) => n + (i.qty || 0), 0));

  // Product names power the Phones / Laptops / Audio flyouts.
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setProducts(d))
      .catch(() => {});
  }, []);

  // Close everything and refresh the user on every navigation.
  useEffect(() => {
    setUser(readUser());
    setOpenKey(null);
    setMobileOpen(false);
    setProfileOpen(false);
    setBellOpen(false);
    refreshBadges();
  }, [location]);

  useEffect(() => {
    if (!bellOpen) setSnap(null);
  }, [bellOpen]);

  // Visiting the page a notification points to counts as seeing it.
  useEffect(() => {
    notes.filter((n) => !n.read && n.link === location.pathname).forEach((n) => markRead(n._id));
  }, [notes, location.pathname]);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(bellRef, () => setBellOpen(false));

  // Esc closes menus; lock page scroll behind the mobile menu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenKey(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (openKey === "search") searchInputRef.current?.focus();
  }, [openKey]);

  const flyouts = useMemo(() => {
    const byCat = (cat) =>
      products
        .filter((p) => p.category?.toLowerCase() === cat)
        .slice(0, 4)
        .map((p) => ({ label: p.title, to: `/home?q=${encodeURIComponent(p.title)}` }));

    return {
      store: {
        heading: "Shop",
        links: [
          { label: "All products", to: "/home" },
          { label: "Phones", to: "/home#mobile" },
          { label: "Laptops", to: "/home#laptop" },
          { label: "Audio", to: "/home#accessories" },
        ],
        quick: QUICK,
      },
      phones: {
        heading: "Shop Phones",
        links: [...byCat("mobile"), { label: "All phones", to: "/home#mobile" }],
        quick: QUICK,
      },
      laptops: {
        heading: "Shop Laptops",
        links: [...byCat("laptop"), { label: "All laptops", to: "/home#laptop" }],
        quick: QUICK,
      },
      audio: {
        heading: "Shop Audio",
        links: [...byCat("accessory"), { label: "All audio & accessories", to: "/home#accessories" }],
        quick: QUICK,
      },
      care: {
        heading: "Care & Repair",
        links: [
          { label: "Repair centre", to: "/repair" },
          { label: "Book a repair", to: "/repair/new" },
          { label: "Before & after gallery", to: "/view-repair-images" },
        ],
        quick: [
          { label: "Warranty check", to: "/warranty-validate" },
          { label: "My orders", to: "/order-history" },
          { label: "Your account", to: "/dashboard" },
        ],
      },
    };
  }, [products]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/home?q=${encodeURIComponent(q)}`);
    setSearchTerm("");
    setOpenKey(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Opening the bell counts as seeing everything: the numbers clear, but the items stay
  // highlighted until it is closed so you can still tell what was new.
  const toggleBell = () => {
    setProfileOpen(false);
    if (bellOpen) return setBellOpen(false);
    setSnap({
      pendingRepairs: isAdmin ? pendingRepairs : 0,
      toDeliver: isAdmin ? toDeliver : 0,
      ids: new Set(notes.filter((n) => !n.read).map((n) => n._id)),
    });
    setBellOpen(true);
    if (unread > 0) markAllRead();
    if (isAdmin && pendingRepairs + toDeliver > 0) markSeen("repairs", "orders");
  };
  const isNew = (n) => (snap ? snap.ids.has(n._id) : !n.read);
  const shown = snap || { pendingRepairs, toDeliver };

  const isActive = (item) => item.match(location.pathname, location.hash);
  const flyout = openKey && openKey !== "search" ? flyouts[openKey] : null;
  const panelOpen = Boolean(flyout) || openKey === "search";

  return (
    <>
      {/* Page blur while a menu is open */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="scrim"
            className="fixed inset-0 z-30 bg-zinc-950/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenKey(null)}
          />
        )}
      </AnimatePresence>

      <header
        className="sticky top-0 z-40 border-b border-black/5 bg-[#fbfbfd]/80 backdrop-blur-xl backdrop-saturate-150"
        onMouseLeave={() => openKey && openKey !== "search" && setOpenKey(null)}
      >
        <div className="mx-auto flex h-11 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Logo compact />

          {/* Primary navigation, spread evenly like apple.com */}
          <nav className="hidden flex-1 items-center justify-center gap-7 px-6 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive(item) ? "page" : undefined}
                onMouseEnter={() => setOpenKey(flyouts[item.key] ? item.key : null)}
                onFocus={() => setOpenKey(flyouts[item.key] ? item.key : null)}
                className={`whitespace-nowrap text-xs tracking-[.01em] transition ${
                  isActive(item) || openKey === item.key
                    ? "text-zinc-950"
                    : "text-zinc-800/80 hover:text-zinc-950"
                }`}
              >
                {item.label}
                {item.key === "care" && <Count n={careCount} className="ml-1.5 align-middle" />}
              </Link>
            ))}
          </nav>

          {/* Utilities */}
          <div className="ml-auto flex items-center lg:ml-0">
            <button
              onClick={() => setOpenKey((k) => (k === "search" ? null : "search"))}
              aria-label="Search"
              aria-expanded={openKey === "search"}
              className={iconBtn}
            >
              <FiSearch className={iconCls} strokeWidth={1.75} />
            </button>

            {user && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={toggleBell}
                  aria-label={`Notifications, ${bellCount} new`}
                  aria-expanded={bellOpen}
                  className={iconBtn}
                >
                  <FiBell className={iconCls} strokeWidth={1.75} />
                  {bellCount > 0 && <Count n={bellCount} className="absolute -right-0.5 top-1.5 !h-3.5 !min-w-[0.875rem] !text-[9px]" />}
                </button>
                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="fixed inset-x-4 top-12 z-50 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-zinc-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80"
                    >
                      <div className="flex items-center justify-between px-4 pb-2 pt-3">
                        <p className="text-sm font-semibold text-zinc-900">Notifications</p>
                      </div>
                      {isAdmin && (shown.pendingRepairs > 0 || shown.toDeliver > 0) && (
                        <div className="mx-2 mb-1 space-y-0.5 rounded-xl bg-zinc-50 p-1">
                          {shown.pendingRepairs > 0 && (
                            <Link to="/admin?tab=repairs" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-100">
                              New repair requests <Count n={shown.pendingRepairs} />
                            </Link>
                          )}
                          {shown.toDeliver > 0 && (
                            <Link to="/admin?tab=orders" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-100">
                              New orders to deliver <Count n={shown.toDeliver} />
                            </Link>
                          )}
                        </div>
                      )}
                      <ul className="max-h-80 overflow-y-auto pb-2">
                        {notes.length === 0 ? (isAdmin && shown.pendingRepairs + shown.toDeliver > 0 ? null : (
                          <li className="px-4 py-6 text-center text-sm text-zinc-500">You're all caught up.</li>
                        )) : (
                          notes.map((n) => (
                            <li key={n._id}>
                              <button
                                onClick={() => {
                                  markRead(n._id);
                                  setBellOpen(false);
                                  if (n.link) navigate(n.link);
                                }}
                                className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50"
                              >
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew(n) ? "bg-zinc-950" : "bg-transparent"}`} />
                                <span className="min-w-0">
                                  <span className={`block text-sm ${isNew(n) ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>{n.title}</span>
                                  <span className="block text-xs text-zinc-500">{n.message}</span>
                                  <span className="mt-0.5 block text-[11px] text-zinc-400">{ago(n.createdAt)}</span>
                                </span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="relative" ref={profileRef}>
              {user ? (
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  className={iconBtn}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-300" />
                  ) : (
                    <FiUser className={iconCls} strokeWidth={1.75} />
                  )}
                </button>
              ) : (
                <Link to="/login" aria-label="Sign in" className={iconBtn}>
                  <FiUser className={iconCls} strokeWidth={1.75} />
                </Link>
              )}
              <AnimatePresence>
                {user && profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-zinc-200"
                  >
                    <p className="truncate px-3 pb-2 pt-2.5 text-xs text-zinc-500">
                      Signed in as <span className="font-medium text-zinc-900">{user.username}</span>
                    </p>
                    {[
                      ...(isAdmin ? [["/admin", "Admin"]] : []),
                      ["/dashboard", "Dashboard"],
                      ["/order-history", "Orders"],
                      ["/my-warranties", "My warranties"],
                      ["/profile", "Profile"],
                    ].map(([to, label]) => (
                      <Link key={to} to={to} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50">
                        {label}
                        {to === "/admin" && <Count n={pendingRepairs + toDeliver} />}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/cart" aria-label={`Bag, ${cartCount} items`} className={iconBtn}>
              <FiShoppingBag className={iconCls} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-2 grid h-3.5 min-w-[0.875rem] place-items-center rounded-full bg-zinc-950 px-1 text-[9px] font-semibold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              className={`${iconBtn} lg:hidden`}
              onClick={() => {
                setOpenKey(null);
                setMobileOpen((o) => !o);
              }}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <FiX className={iconCls} strokeWidth={1.75} /> : <FiMenu className={iconCls} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Flyout panel */}
        <AnimatePresence>
          {flyout && (
            <motion.div
              key="flyout"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full hidden border-b border-black/5 bg-[#fbfbfd]/95 backdrop-blur-xl lg:block"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
                <div className="col-span-8">
                  <p className="text-xs text-zinc-500">{flyout.heading}</p>
                  <ul className="mt-4 space-y-3">
                    {flyout.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          to={l.to}
                          className="text-xs font-semibold text-zinc-900 transition hover:text-brand-600"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-4">
                  <p className="text-xs text-zinc-500">Quick Links</p>
                  <ul className="mt-4 space-y-3">
                    {flyout.quick.map((l) => (
                      <li key={l.label}>
                        <Link to={l.to} className="text-xs font-semibold text-zinc-900 transition hover:text-brand-600">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {openKey === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full border-b border-black/5 bg-[#fbfbfd]/95 backdrop-blur-xl"
            >
              <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
                <form onSubmit={handleSearch} role="search" className="relative">
                  <FiSearch className="pointer-events-none absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search voltora.com"
                    className="w-full border-0 border-b border-zinc-200 bg-transparent py-3 pl-10 pr-2 text-2xl font-medium tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0"
                  />
                </form>
                <p className="mt-8 text-xs text-zinc-500">Quick Links</p>
                <ul className="mt-3 space-y-2.5">
                  {SEARCH_QUICK.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 transition hover:text-brand-600">
                        <FiArrowRight className="h-3.5 w-3.5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-0 top-11 z-30 overflow-y-auto bg-[#fbfbfd] px-6 pb-12 pt-4 lg:hidden"
          >
            <nav aria-label="Mobile">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                >
                  <Link
                    to={item.to}
                    className={`block border-b border-zinc-200/70 py-3 text-2xl font-semibold tracking-tight ${
                      isActive(item) ? "text-zinc-950" : "text-zinc-800"
                    }`}
                  >
                    {item.label}
                    {item.key === "care" && <Count n={careCount} className="ml-2 align-middle" />}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-8 space-y-3 text-sm">
              <p className="text-xs text-zinc-500">Account</p>
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 font-semibold text-zinc-900">
                      Admin <Count n={pendingRepairs + toDeliver} />
                    </Link>
                  )}
                  <Link to="/dashboard" className="block font-semibold text-zinc-900">Dashboard</Link>
                  <Link to="/order-history" className="block font-semibold text-zinc-900">Orders</Link>
                  <Link to="/my-warranties" className="block font-semibold text-zinc-900">My warranties</Link>
                  <Link to="/profile" className="block font-semibold text-zinc-900">Profile</Link>
                  <button onClick={handleLogout} className="block font-semibold text-red-600">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block font-semibold text-zinc-900">Sign in</Link>
                  <Link to="/register" className="block font-semibold text-zinc-900">Create account</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
