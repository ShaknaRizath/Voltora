import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { FiAtSign, FiLock } from "react-icons/fi";
import { API_URL } from "../config";
import AuthShell from "../components/AuthShell";
import { IconInput, PasswordInput } from "../components/inputs";
import { Alert, Field, Spinner, Stepper } from "../components/ui";

const steps = ["Identify", "Authenticate"];

// Only allow redirects to pages on this site.
const safePath = (p) => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : null);

export default function Login() {
  const location = useLocation();
  const backTo = safePath(location.state?.from); // e.g. "/cart", set by pages that asked the user to sign in
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState(0); // 0 -> username, 1 -> password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = useMemo(() => {
    if (!username) return "";
    return username
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [username]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username) return setError("Please enter your username.");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/login-step-one`, { username });
      setProfileImage(res.data.profileImage || "");
      setDisplayName(res.data.username || username);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.msg || "We couldn't find that user. Try again.");
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/login-step-two`, { username, password });
      localStorage.setItem("token", res.data.token);
      // Save user info for the header
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: res.data.username || username,
          profileImage: res.data.profileImage || profileImage,
        })
      );
      window.location.href = backTo || "/dashboard";
    } catch (err) {
      console.error(err.response?.data || err.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setError("Invalid password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useDifferentAccount = () => {
    setStep(0);
    setError("");
    setPassword("");
  };

  return (
    <AuthShell
      title={step === 0 ? "Welcome back" : `Hello, ${displayName || username}`}
      subtitle={step === 0 ? "Sign in to your Voltora account." : "Enter your password to continue."}
      footer={
        <>
          New to Voltora?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Stepper steps={steps} current={step} />

        {error && <Alert>{error}</Alert>}

        {step === 0 ? (
          <form onSubmit={handleUsernameSubmit} className="space-y-5">
            <Field label="Username" htmlFor="username">
              <IconInput
                id="username"
                icon={FiAtSign}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete="username"
                autoFocus
                required
              />
            </Field>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading && <Spinner />} {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName || username}</p>
                <p className="truncate text-xs text-zinc-500">@{username}</p>
              </div>
              <button type="button" onClick={useDifferentAccount} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Change
              </button>
            </div>

            <Field label="Password" htmlFor="password">
              <PasswordInput
                id="password"
                icon={FiLock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                autoFocus
                required
              />
            </Field>

            <div className="flex justify-end">
              <Link to="/reset-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading && <Spinner />} {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
