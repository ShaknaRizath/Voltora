import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import Logo from "./Logo";

const POINTS = [
  "Genuine phones, laptops and accessories",
  "Track every repair from drop-off to pickup",
  "Check warranty coverage in seconds",
];

/** Split-screen layout shared by Login, Register, Password reset and Repair login. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-violet-500/30 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Logo light className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Smart tech,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">
              expertly looked after.
            </span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-zinc-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-brand-300">
                  <FiCheck className="h-3.5 w-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-zinc-500">© {new Date().getFullYear()} Voltora</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Logo className="lg:invisible" />
          <Link to="/home" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900">
            <FiArrowLeft className="h-4 w-4" /> Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900">{title}</h1>
              {subtitle && <p className="mt-2 text-zinc-500">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 text-center text-sm text-zinc-500">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
