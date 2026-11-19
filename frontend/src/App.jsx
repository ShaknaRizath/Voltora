import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

import Start from "./pages/Start";
import Home from "./pages/Home";
import WarrantyValidation from "./pages/warrantyValidate";

import RepairDashboard from "./pages/RepairDashboard";
import AddRepair from "./pages/AddRepair";
import ViewRepair from "./pages/ViewRepair";
import EditRepair from "./pages/EditRepair";
import Login from "./pages/Login";
import ViewRepairImages from "./pages/ViewRepairImages";
import EditRepairBasic from "./pages/EditRepairBasic";
import RepairLogin from "./pages/RepairLogin";

import Cart from "./pages/Cart";
import PaymentSuccess from "./pages/paymentSuccess";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import Register from "./pages/Register";
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import MyWarranties from "./pages/MyWarranties";
import Admin from "./pages/Admin";
import PrivateRoute from "./pages/PrivateRoute";

// Pages that render their own full-screen layout (no header / footer).
const BARE_ROUTES = ["/login", "/register", "/reset-password", "/logins"];

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-zinc-500">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/home" className="btn btn-primary mt-8">
          Back to shop
        </Link>
      </div>
    </div>
  );
}

function LayoutWrapper() {
  const { pathname } = useLocation();
  const bare = BARE_ROUTES.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!bare && <Header />}
      <main className="flex-1">
        <Routes>
          {/* General pages */}
          <Route path="/" element={<Start />} />
          <Route path="/home" element={<Home />} />
          <Route path="/warranty-validate" element={<WarrantyValidation />} />

          {/* Repair management */}
          <Route path="/repair" element={<RepairDashboard />} />
          <Route path="/repair-dashboard" element={<RepairDashboard />} />
          <Route path="/repair/new" element={<AddRepair />} />
          <Route path="/repair/:id" element={<ViewRepair />} />
          <Route path="/repair/:id/edit" element={<EditRepair />} />
          <Route path="/repair/:id/edit-basic" element={<EditRepairBasic />} />
          <Route path="/view-repair-images" element={<ViewRepairImages />} />
          <Route path="/logins" element={<RepairLogin />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* Protected */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-warranties"
            element={
              <PrivateRoute>
                <MyWarranties />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Admin (role is checked again on every API call by the server) */}
          <Route path="/admin" element={<Admin />} />

          {/* Shop */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-history/:id" element={<OrderDetails />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!bare && <Footer />}
      {!bare && <ChatWidget />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}

export default App;
