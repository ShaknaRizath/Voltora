// Maps database errors to friendly JSON responses. Both `msg` and `message` are sent
// because different parts of the frontend read different keys.
export const sendError = (res, err) => {
  if (err?.name === 'ValidationError') {
    const msg = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ msg, message: msg });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const msg =
      field === 'email'
        ? 'User with this email already exists'
        : field === 'username'
        ? 'Username is already taken'
        : 'That value is already in use';
    return res.status(400).json({ msg, message: msg });
  }
  console.error(err);
  return res.status(500).json({ msg: 'Server error', message: 'Server error' });
};
