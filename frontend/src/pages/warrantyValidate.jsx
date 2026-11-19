import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import jsQR from "jsqr";
import { FiCamera, FiHash } from "react-icons/fi";
import { API_URL } from "../config";
import { useToast } from "../components/Toast";
import { Alert, Badge, Field, PageHeader, Spinner } from "../components/ui";
import useAuth from "../hooks/useAuth";

/** Reads a QR code out of an uploaded image. Returns its text, or null if none was found. */
async function decodeQr(file) {
  const bitmap = await createImageBitmap(file);
  // Shrink very large photos so decoding stays fast.
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height)?.data || null;
}

// A QR may hold the bare serial, or a link that carries it as ?serial=...
const serialFromQr = (text) => {
  try {
    return new URL(text).searchParams.get("serial") || text;
  } catch {
    return text;
  }
};

const fmt = (d) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

export default function WarrantyValidation() {
  const toast = useToast();
  const isLoggedIn = useAuth();
  const [params] = useSearchParams();
  const [serialNumber, setSerialNumber] = useState(params.get("serial") || "");
  const [qrFile, setQrFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const lookup = useCallback(async (serial) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/warranty/lookup/${encodeURIComponent(serial.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Arriving from "Check warranty" on an order opens the page with ?serial=... already filled in.
  useEffect(() => {
    const initial = params.get("serial");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckWarranty = async (e) => {
    e.preventDefault();

    if (serialNumber.trim()) return lookup(serialNumber);

    if (!qrFile) {
      toast.error("Upload a QR code or enter a serial number.");
      return;
    }

    setLoading(true);
    try {
      const text = await decodeQr(qrFile);
      if (!text) {
        setLoading(false);
        setResult(null);
        setError("We couldn't find a QR code in that image. Try a sharper, closer photo or enter the serial number.");
        return;
      }
      const serial = serialFromQr(text);
      setSerialNumber(serial);
      await lookup(serial);
    } catch {
      setLoading(false);
      setError("We couldn't read that image. Please try another one or enter the serial number.");
    }
  };

  const active = result?.status === "active";
  const expiringSoon = active && result.daysRemaining <= 30;
  const totalDays = result ? result.warrantyMonths * 30.4 : 0;
  const percentLeft = result && active ? Math.min(100, Math.round((result.daysRemaining / totalDays) * 100)) : 0;

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <PageHeader
        eyebrow="Services"
        title="Warranty check"
        description="Verify your device's warranty status using its QR code or serial number."
        actions={
          isLoggedIn && (
            <Link to="/my-warranties" className="btn btn-secondary">
              My warranties
            </Link>
          )
        }
      />

      <form onSubmit={handleCheckWarranty} className="card space-y-6 p-6 sm:p-8">
        <div>
          <span className="label">Upload QR code</span>
          <label className="relative flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
            <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-400 shadow-soft">
              <FiCamera className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-zinc-700">{qrFile ? qrFile.name : "Click to upload an image"}</span>
            <span className="text-xs text-zinc-500">PNG or JPG of the QR code</span>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => setQrFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" /> or <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <Field label="Serial number" htmlFor="serial" hint="You'll find it on your order page, e.g. VLT-7K2Q-9XMA">
          <div className="relative">
            <FiHash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="serial"
              type="text"
              placeholder="e.g. VLT-7K2Q-9XMA"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="input !pl-10"
            />
          </div>
        </Field>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Spinner />} {loading ? "Checking…" : "Check warranty"}
        </button>
      </form>

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {result && (
        <section className="card mt-6 p-6 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Warranty result</p>
              <h2 className="mt-1 text-2xl font-bold">{result.productName}</h2>
              <p className="mt-1 font-mono text-sm text-zinc-500">{result.serialNumber}</p>
            </div>
            <Badge tone={!active ? "red" : expiringSoon ? "amber" : "brand"}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {!active ? "Expired" : expiringSoon ? "Expiring soon" : "Active"}
            </Badge>
          </div>

          {active && (
            <div className="mt-6">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-zinc-900">
                  {result.daysRemaining} day{result.daysRemaining === 1 ? "" : "s"} remaining
                </span>
                <span className="text-zinc-500">{percentLeft}% left</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${expiringSoon ? "bg-amber-500" : "bg-brand-600"}`}
                  style={{ width: `${percentLeft}%` }}
                />
              </div>
            </div>
          )}

          <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Purchased</dt>
              <dd className="mt-0.5 font-medium">{fmt(result.purchasedAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{active ? "Expires" : "Expired on"}</dt>
              <dd className="mt-0.5 font-medium">{fmt(result.expiresAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Coverage</dt>
              <dd className="mt-0.5 font-medium">{result.warrantyMonths} months</dd>
            </div>
          </dl>

          {!active && (
            <p className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
              This warranty has ended. You can still book a paid repair from the Care &amp; Repair page.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
