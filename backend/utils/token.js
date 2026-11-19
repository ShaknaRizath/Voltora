import jwt from 'jsonwebtoken';

// One token format for every login route.
export const signToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
