import React from "react";
import { Link } from "react-router-dom";
import { FiZap } from "react-icons/fi";

export default function Logo({ light = false, compact = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center ${compact ? "gap-2" : "gap-2.5"} ${className}`}
      aria-label="Voltora home"
    >
      <span
        className={`grid place-items-center bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft ${
          compact ? "h-6 w-6 rounded-md" : "h-8 w-8 rounded-lg"
        }`}
      >
        <FiZap className={`fill-white ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
      </span>
      <span
        className={`font-extrabold uppercase tracking-tight ${compact ? "text-[13px]" : "text-[17px]"} ${
          light ? "text-white" : "text-zinc-950"
        }`}
      >
        Voltora
      </span>
    </Link>
  );
}
