import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiRefreshCw } from "react-icons/fi";
import { API_URL } from "../config";
import AuthShell from "../components/AuthShell";
import { IconInput, PasswordInput } from "../components/inputs";
import { Alert, Field, OtpInput, PasswordStrength, Spinner, Stepper } from "../components/ui";

const steps = ["Email", "Verify", "Reset"];

const COPY = [
  { title: "Reset your password", subtitle: "Enter your email and we'll send you a verification code." },
  { title: "Verify it's you", subtitle: "Enter the code we just emailed you." },
  { title: "Choose a new password", subtitle: "Make it strong and easy for you to remember." },
];

export default function PasswordReset() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 email, 1 otp, 2 new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [otpKey, setOtpKey] = useState(0);

  const isPasswordMatch = useMemo(
    () => Boolean(newPassword && confirmPassword && newPassword === confirmPassword),
    [newPassword, confirmPassword]
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    setError("");
    setSuccess("");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      // The code is generated, emailed and stored by the server. The browser never sees it.
      await axios.post(`${API_URL}/api/users/forgot-password`, { email });
      setSuccess("If that email is registered, a verification code is on its way.");
      setSecondsLeft(30);
      setOtp("");
      setOtpKey((k) => k + 1);
      setStep(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (otp.length !== 6) return setError("Please enter the full 6-digit code.");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/users/verify-reset-code`, { email, otp });
      setStep(2);
      setSuccess("Code verified. You can now set a new password.");
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isPasswordMatch) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/users/reset-password`, { email, otp, newPassword });
      setSuccess("Password reset successful. Redirecting to login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={COPY[step].title}
      subtitle={COPY[step].subtitle}
      footer={
        <>
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Stepper steps={steps} current={step} />
        {error && <Alert>{error}</Alert>}
        {success && <Alert tone="green">{success}</Alert>}

        {step === 0 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <Field label="Email" htmlFor="email">
              <IconInput
                id="email"
                icon={FiMail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </Field>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading && <Spinner />} {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-sm text-zinc-500">
              Enter the 6-digit code we sent to <strong className="text-zinc-900">{email}</strong>
            </p>
            <OtpInput key={otpKey} onChange={setOtp} error={Boolean(error)} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading && <Spinner className="h-4 w-4" />} Verify
              </button>
              <button
                type="button"
                className="btn btn-secondary flex-1"
                disabled={secondsLeft > 0 || loading}
                onClick={handleSendOtp}
              >
                <FiRefreshCw className="h-4 w-4" />
                {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Field label="New password" htmlFor="newPassword">
              <PasswordInput
                id="newPassword"
                icon={FiLock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                required
              />
            </Field>
            <PasswordStrength password={newPassword} />
            <Field
              label="Confirm password"
              htmlFor="confirmPassword"
              error={confirmPassword && !isPasswordMatch ? "Passwords must match" : ""}
            >
              <PasswordInput
                id="confirmPassword"
                icon={FiLock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                required
              />
            </Field>
            <button type="submit" disabled={!isPasswordMatch || loading} className="btn btn-primary btn-lg w-full">
              {loading && <Spinner />} {loading ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
