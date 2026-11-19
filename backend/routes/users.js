import express from 'express';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { signToken } from '../utils/token.js';
import { sendError } from '../utils/errors.js';
import { sendEmail } from '../utils/sendEmail.js';
import { pick } from '../middleware/validate.js';

const router = express.Router();

import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
  isEmailVerified,
  normalizeEmail,
  safeEqual,
  signEmailVerification,
} from '../utils/otp.js';

/* ------------------------------------------------------------------ */
/* Registration (the email address must be verified first) and login   */
/* ------------------------------------------------------------------ */

// Step 1: email a 6-digit code to the address being registered
router.post('/send-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ msg: 'Please enter a valid email address' });
    }
    if (await User.exists({ email })) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    const existing = await EmailVerification.findOne({ email });
    if (existing && Date.now() - existing.sentAt.getTime() < OTP_RESEND_MS) {
      return res.status(429).json({ msg: 'Please wait a few seconds before requesting another code.' });
    }

    const otp = generateOtp();
    await EmailVerification.findOneAndUpdate(
      { email },
      { otpHash: hashOtp(otp), attempts: 0, sentAt: new Date(), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      { upsert: true }
    );

    await sendEmail({
      to: email,
      subject: 'Verify your email for Voltora',
      text: `Your Voltora verification code is ${otp}. It expires in 10 minutes. If you didn't try to create an account, you can ignore this email.`,
      html: `<p>Your Voltora verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p><p>It expires in 10 minutes. If you didn't try to create an account, you can ignore this email.</p>`,
    });
    res.json({ msg: 'Verification code sent' });
  } catch (err) {
    console.error('send-verification error:', err.message);
    res.status(500).json({ msg: 'We could not send the verification code. Please try again later.' });
  }
});

// Step 2: check the code. Returns a short-lived token that registration requires.
router.post('/verify-email-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const record = await EmailVerification.findOne({ email });
    const invalid = () => res.status(400).json({ msg: 'Invalid or expired code. Please try again.' });

    if (!record || record.expiresAt < new Date() || record.attempts >= OTP_MAX_ATTEMPTS) return invalid();

    if (!safeEqual(hashOtp(String(req.body.otp || '').trim()), record.otpHash)) {
      record.attempts += 1;
      await record.save();
      return invalid();
    }

    await record.deleteOne(); // a code can only be used once
    res.json({ verificationToken: signEmailVerification(email) });
  } catch (err) {
    sendError(res, err);
  }
});

// Step 3: register
router.post('/register', async (req, res) => {
  try {
    const data = pick(req.body, ['name', 'username', 'email', 'password', 'mobile', 'profileImage']);
    data.email = normalizeEmail(data.email);

    if (!isEmailVerified(data.email, req.body.verificationToken)) {
      return res.status(400).json({ msg: 'Please verify your email address first.' });
    }

    if (await User.exists({ email: data.email })) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }
    if (await User.exists({ username: data.username })) {
      return res.status(400).json({ msg: 'Username is already taken' });
    }

    // Role is intentionally not accepted from the client.
    const user = await User.create(data);
    res.json({ token: signToken(user) });
  } catch (err) {
    sendError(res, err);
  }
});

// Login step 1: show the profile picture for a username
router.post('/login-step-one', async (req, res) => {
  try {
    const user = await User.findOne({ username: String(req.body.username || '') });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ profileImage: user.profileImage });
  } catch (err) {
    sendError(res, err);
  }
});

// Login step 2: verify the password and issue the token
router.post('/login-step-two', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: String(username || '') });
    if (!user || !(await user.comparePassword(String(password || '')))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    res.json({ token: signToken(user), username: user.username, profileImage: user.profileImage });
  } catch (err) {
    sendError(res, err);
  }
});

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const { username, profileImage } = req.body;

    if (username && username !== user.username) {
      if (await User.exists({ username, _id: { $ne: user._id } })) {
        return res.status(400).json({ msg: 'Username already taken', message: 'Username already taken' });
      }
      user.username = username;
    }
    if (profileImage) {
      if (!String(profileImage).startsWith('data:image/') || profileImage.length > 3_000_000) {
        return res.status(400).json({ msg: 'Profile image must be an image under ~2MB', message: 'Profile image must be an image under ~2MB' });
      }
      user.profileImage = profileImage;
    }

    await user.save();
    res.json(user); // password hash is stripped by the model's toJSON
  } catch (err) {
    sendError(res, err);
  }
});

// Change password (authenticated)
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await user.comparePassword(String(currentPassword || '')))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = String(newPassword || '');
    await user.save(); // validation (min length) + hashing happen in the model
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete account (authenticated)
router.delete('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    sendError(res, err);
  }
});

/* ------------------------------------------------------------------ */
/* Password reset: the code is generated, stored and checked on the    */
/* server, so it can't be bypassed from the browser.                   */
/* ------------------------------------------------------------------ */

// Step 1: email a 6-digit code. Always answers the same way so it can't be used to find out
// which emails are registered.
router.post('/forgot-password', async (req, res) => {
  const generic = { msg: 'If that email is registered, a verification code has been sent.' };
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ msg: 'Please enter your email.' });

    const user = await User.findOne({ email }).select('+resetOtpExpires');
    if (!user) return res.json(generic);

    // Cooldown between sends
    const sentAt = user.resetOtpExpires ? user.resetOtpExpires.getTime() - OTP_TTL_MS : 0;
    if (Date.now() - sentAt < OTP_RESEND_MS) {
      return res.status(429).json({ msg: 'Please wait a few seconds before requesting another code.' });
    }

    const otp = generateOtp();
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.resetOtpAttempts = 0;
    await user.save({ validateModifiedOnly: true });

    await sendEmail({
      to: user.email,
      subject: 'Your Voltora verification code',
      text: `Your Voltora password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>Your Voltora password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    });
    res.json(generic);
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ msg: 'We could not send the verification code. Please try again later.' });
  }
});

// Checks a code and burns an attempt on failure. Returns the user when the code is right.
const checkOtp = async (email, otp) => {
  const user = await User.findOne({ email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) return null;
  if ((user.resetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) return null;

  if (!safeEqual(hashOtp(String(otp || '').trim()), user.resetOtpHash)) {
    user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
    await user.save({ validateModifiedOnly: true });
    return null;
  }
  return user;
};

// Step 2 (optional early feedback): is the code correct?
router.post('/verify-reset-code', async (req, res) => {
  try {
    const user = await checkOtp(normalizeEmail(req.body.email), req.body.otp);
    if (!user) return res.status(400).json({ msg: 'Invalid or expired code. Please try again.' });
    res.json({ msg: 'Code verified' });
  } catch (err) {
    sendError(res, err);
  }
});

// Step 3: set the new password (the code is checked again here and then burned)
router.post('/reset-password', async (req, res) => {
  try {
    const { newPassword, otp } = req.body;
    const user = await checkOtp(normalizeEmail(req.body.email), otp);
    if (!user) return res.status(400).json({ msg: 'Invalid or expired code. Please request a new one.' });

    user.password = String(newPassword || '');
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save(); // validates the new password, then hashes it
    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
