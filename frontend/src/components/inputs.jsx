import React, { useState } from "react";
import { FiChevronDown, FiEye, FiEyeOff } from "react-icons/fi";

/** Text input with a leading icon. */
export function IconInput({ icon: Icon, className = "", ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      )}
      <input {...props} className={`input ${Icon ? "!pl-10" : ""} ${className}`} />
    </div>
  );
}

/** Password input with a show / hide toggle. */
export function PasswordInput({ icon: Icon, className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      )}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`input !pr-11 ${Icon ? "!pl-10" : ""} ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
      >
        {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Styled dropdown: hides the cramped native arrow and draws a properly placed chevron. */
export function Select({ className = "", selectClassName = "", children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`input cursor-pointer appearance-none !pr-10 ${selectClassName}`}>
        {children}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}
