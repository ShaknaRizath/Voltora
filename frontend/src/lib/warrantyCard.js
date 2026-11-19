import QRCode from "qrcode";

// What the QR code contains: a link to the warranty check page with the serial filled in.
// A phone camera that scans it opens the check directly, and uploading the image on the
// Warranty page works too (the page understands both links and bare serial numbers).
export const warrantyLink = (serial) =>
  `${window.location.origin}/warranty-validate?serial=${encodeURIComponent(serial)}`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Shrinks text until it fits the given width.
const fitText = (ctx, text, maxWidth, startSize, weight, family) => {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    size -= 1;
  } while (ctx.measureText(text).width > maxWidth && size > 12);
};

/** Builds a printable warranty card (QR + product + serial + expiry) and downloads it as a PNG. */
export async function downloadWarrantyCard({ serialNumber, productName, expiresAt }) {
  const qr = await loadImage(
    await QRCode.toDataURL(warrantyLink(serialNumber), { margin: 1, width: 520, errorCorrectionLevel: "M" })
  );

  const W = 640;
  const H = 840;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const sans = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  // card
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  ctx.textAlign = "center";
  ctx.fillStyle = "#4f46e5";
  ctx.font = `700 20px ${sans}`;
  ctx.fillText("VOLTORA  ·  WARRANTY", W / 2, 58);

  ctx.drawImage(qr, 60, 90, 520, 520);

  ctx.fillStyle = "#18181b";
  fitText(ctx, productName, W - 80, 30, 700, sans);
  ctx.fillText(productName, W / 2, 672);

  ctx.fillStyle = "#27272a";
  fitText(ctx, serialNumber, W - 80, 30, 600, mono);
  ctx.fillText(serialNumber, W / 2, 722);

  ctx.fillStyle = "#71717a";
  ctx.font = `400 20px ${sans}`;
  ctx.fillText(`Covered until ${new Date(expiresAt).toLocaleDateString()}`, W / 2, 766);
  ctx.font = `400 16px ${sans}`;
  ctx.fillText("Scan with your phone camera, or upload on the Warranty page", W / 2, 806);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voltora-warranty-${serialNumber}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
