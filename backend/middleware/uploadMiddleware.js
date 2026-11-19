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

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

// What gets stored in MongoDB and appended to the API URL by the frontend.
export const publicPath = (file) => (file ? `uploads/${file.filename}` : '');

// Best-effort delete of an uploaded file (by multer file object or stored "uploads/..." path).
export const removeUpload = (fileOrPath) => {
  if (!fileOrPath) return;
  const name = typeof fileOrPath === 'string' ? path.basename(fileOrPath.replace(/\\/g, '/')) : fileOrPath.filename;
  if (!name) return;
  fs.unlink(path.join(UPLOAD_DIR, name), () => {});
};

export default upload;
