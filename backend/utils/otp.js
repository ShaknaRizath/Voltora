// Shared helpers for one-time email codes (password reset and registration).
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const OTP_TTL_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
export const OTP_RESEND_MS = 30 * 1000; // minimum gap between two codes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is locked

export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Codes are stored hashed, so a database leak doesn't expose usable codes.
export const hashOtp = (otp) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(otp)).digest('hex');

export const safeEqual = (a, b) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

export const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

// After a visitor proves they own an email address they get a short-lived signed token.
// Registration requires it, so verification can't be skipped from the browser.
export const signEmailVerification = (email) =>
  jwt.sign({ purpose: 'email-verified', email }, process.env.JWT_SECRET, { expiresIn: '30m' });

export const isEmailVerified = (email, token) => {
  try {
    const payload = jwt.verify(String(token || ''), process.env.JWT_SECRET);
    return payload.purpose === 'email-verified' && payload.email === email;
  } catch {
    return false;
  }
};
