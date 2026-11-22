import React, { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiAtSign, FiCamera, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { API_URL } from "../config";
import AuthShell from "../components/AuthShell";
import { IconInput, PasswordInput } from "../components/inputs";
import { Alert, Field, OtpInput, PasswordStrength, Spinner, Stepper } from "../components/ui";

const steps = ["Account", "Verify", "Profile"];

const COPY = [
  { title: "Create your account", subtitle: "Join Voltora in under a minute." },
  { title: "Check your inbox", subtitle: "Verify your email address to continue." },
  { title: "Almost done", subtitle: "Add a few last details to finish." },
];

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verificationToken, setVerificationToken] = useState(""); // proof of email ownership, issued by the server
  const [otpKey, setOtpKey] = useState(0); // remounts the OTP boxes after a wrong code

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    profileImage: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { name, username, email, password, confirmPassword, mobile, profileImage } = formData;

  const onChange = (e) => {
    if (e.target.name === "profileImage") {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const sendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      // The code is generated, emailed and checked by the server, so it can't be skipped from the browser.
      await axios.post(`${API_URL}/api/users/send-verification`, { email });
      setInfo("We sent a verification code to your email.");
      setOtpKey((k) => k + 1);
      setStep(1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "We couldn't send the verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (!name || !username || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    sendOtp();
  };

  const handleOtpComplete = async (value) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/api/users/verify-email-code`, { email, otp: value });
      setVerificationToken(res.data.verificationToken);
      setInfo("Email verified ✔");
      setStep(2);
    } catch (err) {
      setInfo("");
      setError(err.response?.data?.msg || "Invalid code. Double-check and try again.");
      setOtpKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    setInfo("");
    setStep((s) => Math.max(0, s - 1));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await axios.post(`${API_URL}/api/users/register`, {
        name,
        username,
        email,
        password,
        mobile,
        profileImage,
        verificationToken,
      });
      setInfo("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login", { state: location.state }), 650);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Registration failed. Please try again.");
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
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Stepper steps={steps} current={step} />
        {error && <Alert>{error}</Alert>}
        {info && <Alert tone="green">{info}</Alert>}

        {/* Step 1: account */}
        {step === 0 && (
          <form onSubmit={handleNext} className="space-y-4">
            <Field label="Full name" htmlFor="name">
              <IconInput id="name" icon={FiUser} name="name" value={name} onChange={onChange} placeholder="Jane Doe" autoComplete="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Username" htmlFor="username">
                <IconInput id="username" icon={FiAtSign} name="username" value={username} onChange={onChange} placeholder="jane_doe" autoComplete="username" required />
              </Field>
              <Field label="Email" htmlFor="email">
                <IconInput id="email" icon={FiMail} name="email" type="email" value={email} onChange={onChange} placeholder="you@example.com" autoComplete="email" required />
              </Field>
            </div>
            <Field label="Password" htmlFor="password">
              <PasswordInput id="password" icon={FiLock} name="password" value={password} onChange={onChange} placeholder="Create a password" autoComplete="new-password" required />
            </Field>
            <PasswordStrength password={password} />
            <Field
              label="Confirm password"
              htmlFor="confirmPassword"
              error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : ""}
            >
              <PasswordInput
                id="confirmPassword"
                icon={FiLock}
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
            </Field>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading && <Spinner />} {loading ? "Sending code…" : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2: verify */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-center text-sm text-zinc-500">
              Enter the 6-digit code we emailed to <strong className="text-zinc-900">{email}</strong>
            </p>
            <OtpInput key={otpKey} onComplete={handleOtpComplete} error={Boolean(error)} />
            <div className="flex gap-3">
              <button type="button" onClick={handleBack} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="button" onClick={sendOtp} disabled={loading} className="btn btn-ghost flex-1">
                {loading && <Spinner className="h-4 w-4" />} Resend code
              </button>
            </div>
          </div>
        )}

        {/* Step 3: profile */}
        {step === 2 && (
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Mobile number" htmlFor="mobile">
              <IconInput id="mobile" icon={FiPhone} name="mobile" value={mobile} onChange={onChange} placeholder="+94 77 123 4567" autoComplete="tel" required />
            </Field>

            <div>
              <span className="label">
                Profile photo <span className="font-normal text-zinc-400">(optional)</span>
              </span>
              <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200">
                    <FiCamera className="h-6 w-6" />
                  </span>
                )}
                <label className="btn btn-secondary btn-sm cursor-pointer">
                  {profileImage ? "Change photo" : "Upload photo"}
                  <input type="file" name="profileImage" hidden onChange={onChange} accept="image/*" />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleBack} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-[2]">
                {loading && <Spinner className="h-4 w-4" />} {loading ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
