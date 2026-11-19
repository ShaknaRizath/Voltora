// Small, reusable UI building blocks used across every page.
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronRight, FiX } from "react-icons/fi";

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */
export const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
  </svg>
);

export const PageLoader = ({ label = "Loading…" }) => (
  <div className="grid min-h-[50vh] place-items-center">
    <div className="flex flex-col items-center gap-3 text-zinc-500">
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page structure                                                      */
/* ------------------------------------------------------------------ */
export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
    {items.map((item, i) => (
      <React.Fragment key={item.label}>
        {i > 0 && <FiChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
        {item.to ? (
          <Link to={item.to} className="transition hover:text-zinc-900">
            {item.label}
          </Link>
        ) : (
          <span className="font-medium text-zinc-900">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-zinc-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const PageShell = ({ children, className = "", narrow = false }) => (
  <div className={`container-page py-8 sm:py-12 ${narrow ? "max-w-3xl" : ""} ${className}`}>{children}</div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="card flex flex-col items-center px-6 py-16 text-center">
    {Icon && (
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">
        <Icon className="h-6 w-6" />
      </span>
    )}
    <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */
const TONES = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  dark: "bg-zinc-900 text-white ring-zinc-900",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const Badge = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

const STATUS_TONE = {
  Pending: "amber",
  Approved: "sky",
  "In Progress": "violet",
  Resolved: "dark",
  Rejected: "red",
};

export const StatusBadge = ({ status }) => (
  <Badge tone={STATUS_TONE[status] || "neutral"}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || "Unknown"}
  </Badge>
);

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */
export const Field = ({ label, hint, error, children, htmlFor }) => (
  <div>
    {label && (
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1.5 text-xs text-red-600">{error}</p>
    ) : (
      hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
    )}
  </div>
);

export const Alert = ({ tone = "red", children }) => {
  const styles = {
    red: "bg-red-50 text-red-800 ring-red-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    blue: "bg-brand-50 text-brand-800 ring-brand-200",
  };
  return <div className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${styles[tone]}`}>{children}</div>;
};

/** Drag-and-drop style image picker with preview. */
export const ImagePicker = ({ label, file, onChange, required = false, currentUrl }) => {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || currentUrl;

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <label className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
        {shown ? (
          <img src={shown} alt="Preview" className="mb-3 h-40 w-full rounded-xl object-cover" />
        ) : (
          <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-400 shadow-soft">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <span className="text-sm font-medium text-zinc-700">
          {file ? file.name : shown ? "Click to replace image" : "Click to upload an image"}
        </span>
        <span className="text-xs text-zinc-500">PNG or JPG</span>
        <input
          type="file"
          accept="image/*"
          required={required && !currentUrl}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Password strength                                                   */
/* ------------------------------------------------------------------ */
const computeStrength = (password = "") => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

export const PasswordStrength = ({ password }) => {
  const score = computeStrength(password);
  const meta =
    score >= 4
      ? { text: "Strong", bar: "bg-emerald-500", txt: "text-emerald-600" }
      : score >= 3
      ? { text: "Good", bar: "bg-brand-500", txt: "text-brand-600" }
      : score >= 2
      ? { text: "Weak", bar: "bg-amber-500", txt: "text-amber-600" }
      : { text: "Very weak", bar: "bg-red-500", txt: "text-red-600" };

  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              password && i <= score ? meta.bar : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${password ? meta.txt : "text-zinc-400"}`}>
        {password ? `Password strength: ${meta.text}` : "Use 8+ characters with upper, lower, numbers and symbols"}
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */
export const Stepper = ({ steps, current }) => (
  <ol className="flex items-center">
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition ${
                done
                  ? "bg-brand-600 text-white"
                  : active
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`text-xs font-medium ${active ? "text-zinc-900" : "text-zinc-500"}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className={`mx-3 h-px flex-1 ${done ? "bg-brand-600" : "bg-zinc-200"}`} />
          )}
        </li>
      );
    })}
  </ol>
);

/* ------------------------------------------------------------------ */
/* OTP input                                                           */
/* ------------------------------------------------------------------ */
export function OtpInput({ length = 6, onChange, onComplete, error = false }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const commit = (next) => {
    setValues(next);
    const code = next.join("");
    onChange?.(code);
    if (code.length === length) onComplete?.(code);
  };

  const handleChange = (i, v) => {
    if (!/^[0-9]?$/.test(v)) return;
    const next = [...values];
    next[i] = v;
    commit(next);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(length).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    commit(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={v}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-12 w-10 rounded-xl border-0 bg-white text-center text-xl font-semibold text-zinc-900 ring-1 ring-inset transition focus:outline-none focus:ring-2 sm:h-14 sm:w-12 ${
            error ? "ring-red-300 focus:ring-red-500" : "ring-zinc-200 focus:ring-brand-500"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal + confirm dialog                                              */
/* ------------------------------------------------------------------ */
export function Modal({ open, onClose, children, maxWidth = "max-w-lg", label }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`relative max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-t-3xl bg-white shadow-pop sm:rounded-3xl`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
            >
              <FiX className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  children,
  confirmDisabled = false,
}) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md" label={title}>
      <div className="p-6 sm:p-7">
        <h3 className="pr-10 text-lg font-semibold text-zinc-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-zinc-500">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
