// Small helpers shared by every tab of the admin dashboard.
import React from "react";
import { FiSearch } from "react-icons/fi";
import { EmptyState, Spinner } from "../../components/ui";

export const SearchBox = ({ value, onChange, placeholder = "Search" }) => (
  <div className="relative min-w-[14rem] flex-1">
    <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input !pl-10" />
  </div>
);

export const Toolbar = ({ children }) => <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;

/** Card with a header row and a horizontally scrollable table. */
export const TableCard = ({ headers, children, loading, empty, count }) => {
  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (count === 0) return empty;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              {headers.map((h, i) => (
                <th key={h || i} className={`px-5 py-3.5 ${i === headers.length - 1 && h === "Actions" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
};

export const Td = ({ children, className = "" }) => <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>;

export const IconButton = ({ title, onClick, danger = false, disabled = false, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 ${
      danger ? "hover:!bg-red-50 hover:!text-red-600" : ""
    }`}
  >
    {children}
  </button>
);

export const NothingHere = ({ icon, title, description }) => <EmptyState icon={icon} title={title} description={description} />;
