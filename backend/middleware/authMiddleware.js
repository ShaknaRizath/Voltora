// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

// The app historically sent tokens two ways (Authorization: Bearer ... and x-auth-token).
// Both are accepted so the frontend keeps working.
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return req.header('x-auth-token') || null;
};

// Normalises old-format tokens ({ user: { id } }) and new ones ({ userId, role }).
const decode = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const userId = payload.userId || payload.user?.id;
  if (!userId) throw new Error('Malformed token');
  return { userId, id: userId, role: payload.role || 'user' };
};

export const verifyToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.', msg: 'No token, authorization denied' });
  }
  try {
    req.user = decode(token);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.', msg: 'Token is not valid' });
  }
};

// Attaches req.user when a valid token is present, but never rejects the request.
export const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = decode(token);
    } catch {
      /* ignore: treated as a guest */
    }
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.', msg: 'Access denied. Admins only.' });
  }
  next();
};
