import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLock, FiMail } from "react-icons/fi";
import { API_URL } from "../config";
import AuthShell from "../components/AuthShell";
import { IconInput, PasswordInput } from "../components/inputs";
import { Field, Spinner } from "../components/ui";
import { useToast } from "../components/Toast";

export default function RepairLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const redirectTo = location.state?.redirectTo || "/repair";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      toast.success("Signed in successfully");
      navigate(redirectTo);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Repair centre sign in" subtitle="Sign in with your email to submit and manage repair requests.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <IconInput
            id="email"
            icon={FiMail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            icon={FiLock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </Field>
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Spinner />} {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
