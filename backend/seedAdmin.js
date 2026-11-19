// Creates an admin account, or promotes an existing user to admin.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run seed:admin
//
// Optional: ADMIN_USERNAME, ADMIN_NAME, ADMIN_MOBILE
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '0000000000';

if (!ADMIN_EMAIL) {
  console.error("❌ Set ADMIN_EMAIL (and ADMIN_PASSWORD for a new account).\n   Example: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run seed:admin");
  process.exit(1);
}

try {
  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    await existing.save({ validateModifiedOnly: true });
    console.log(`✅ ${email} is now an admin (password unchanged).`);
  } else {
    if (!ADMIN_PASSWORD) {
      console.error('❌ No account with that email exists yet, so ADMIN_PASSWORD is required to create one.');
      process.exit(1);
    }
    await User.create({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      email,
      password: ADMIN_PASSWORD,
      mobile: ADMIN_MOBILE,
      role: 'admin',
    });
    console.log(`✅ Admin account created for ${email} (username: ${ADMIN_USERNAME}).`);
  }
} catch (err) {
  console.error('❌ Could not create the admin:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
