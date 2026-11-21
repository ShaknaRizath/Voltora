// middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Extension comes from the MIME type, never from the client-supplied file name.
const EXTENSIONS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXTENSIONS[file.mimetype]}`),
});

const fileFilter = (_req, file, cb) => {
  if (EXTENSIONS[file.mimetype]) return cb(null, true);
  const err = new Error('Only PNG, JPG, WEBP or GIF images are allowed');
  err.status = 400;
  cb(err);
};

// ---- Optional Cloudinary storage -------------------------------------------------------------
// Hosts like Render wipe the local disk on every restart, so in production set CLOUDINARY_URL
// (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) and images are stored there instead. Without it,
// files go to the local uploads/ folder, which is what you want in development.
const cloud = (() => {
  const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(process.env.CLOUDINARY_URL || '');
  return m ? { key: m[1], secret: m[2], name: m[3] } : null;
})();

const limits = { fileSize: 5 * 1024 * 1024, files: 1 };
const multerUpload = multer({ storage: cloud ? multer.memoryStorage() : storage, fileFilter, limits });

// Sends the in-memory file to Cloudinary (signed upload) and records its https URL on req.file.
const sendToCloud = async (req, _res, next) => {
  if (!req.file) return next();
  try {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const folder = 'voltora';
    const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${cloud.secret}`).digest('hex');
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), 'upload');
    form.append('api_key', cloud.key);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud.name}/image/upload`, { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || 'Image upload failed');
    req.file.url = data.secure_url;
    req.file.buffer = undefined;
    next();
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    next(Object.assign(new Error('Could not store the image. Please try again.'), { status: 502, expose: true }));
  }
};

// Same call shape as multer: upload.single('field') works in any route.
const upload = {
  single: (field) => (cloud ? [multerUpload.single(field), sendToCloud] : multerUpload.single(field)),
};

// What gets stored in MongoDB. Local files are appended to the API URL by the frontend,
// Cloudinary files are already full https URLs.
export const publicPath = (file) => (file ? file.url || `uploads/${file.filename}` : '');

// Best-effort delete of an uploaded file (by multer file object or stored "uploads/..." path).
export const removeUpload = (fileOrPath) => {
  if (!fileOrPath) return;
  if (typeof fileOrPath === 'string' && /^https?:/.test(fileOrPath)) return; // hosted images stay in the cloud
  const name = typeof fileOrPath === 'string' ? path.basename(fileOrPath.replace(/\\/g, '/')) : fileOrPath.filename;
  if (!name) return;
  fs.unlink(path.join(UPLOAD_DIR, name), () => {});
};

export default upload;
