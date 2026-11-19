import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { warrantyLink } from "../lib/warrantyCard";

/** QR code that links to the warranty check for a serial (scan it, or upload it on the Warranty page). */
export default function WarrantyQR({ serial, size = 96, className = "" }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(warrantyLink(serial), { margin: 1, width: size * 3, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(""));
    return () => {
      cancelled = true;
    };
  }, [serial, size]);

  if (!src) return <div className={`skeleton ${className}`} style={{ width: size, height: size }} />;
  return (
    <img
      src={src}
      alt={`QR code for serial ${serial}`}
      width={size}
      height={size}
      className={`rounded-lg bg-white ${className}`}
    />
  );
}
