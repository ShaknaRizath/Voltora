// controllers/authController.js  (email + password flavour, used by /api/auth)
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { sendError } from '../utils/errors.js';
import { pick } from '../middleware/validate.js';
import { isEmailVerified } from '../utils/otp.js';

// 🔐 Register User
export const registerUser = async (req, res) => {
  try {
    const data = pick(req.body, ['name', 'username', 'email', 'password', 'mobile', 'profileImage']);
    data.email = String(data.email || '').trim().toLowerCase();

    if (!isEmailVerified(data.email, req.body.verificationToken)) {
      return res.status(400).json({ message: 'Please verify your email address first.', msg: 'Please verify your email address first.' });
    }

    if (await User.exists({ email: data.email })) {
      return res.status(400).json({ message: 'Email already registered', msg: 'Email already registered' });
    }

    // `role` from the request body is ignored on purpose, so nobody can self-promote to admin.
    const user = await User.create(data);
    res.status(201).json({ message: 'User registered successfully', token: signToken(user) });
  } catch (err) {
    sendError(res, err);
  }
};

// 🔐 Login User
export const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(String(req.body.password || '')))) {
      return res.status(400).json({ message: 'Invalid email or password', msg: 'Invalid email or password' });
    }

    res.status(200).json({ token: signToken(user) });
  } catch (err) {
    sendError(res, err);
  }
};
