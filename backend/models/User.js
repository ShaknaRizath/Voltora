import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[A-Za-z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes and underscores'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    mobile: { type: String, required: [true, 'Mobile number is required'], trim: true, maxlength: 20 },
    // Only ever set server-side (see seedAdmin.js). Clients can never choose their own role.
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileImage: { type: String }, // Base64 encoded string

    // Password-reset code (stored hashed, short-lived, attempt-limited). Never selected by default.
    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// Validation (including minlength) runs before this hook, so the plain password is
// checked first and only the bcrypt hash is stored.
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never serialise the password hash into API responses.
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetOtpHash;
    delete ret.resetOtpExpires;
    delete ret.resetOtpAttempts;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', UserSchema);
