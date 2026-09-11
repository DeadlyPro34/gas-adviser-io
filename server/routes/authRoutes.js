const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { sendOtpEmail, generateOtp } = require('../helpers/emailHelper');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gas-adviser-fallback-secret';
const JWT_EXPIRES_IN = '7d';

// ─── Helper: sign JWT ──────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user);
    console.log(`[auth] ✅ New user registered — ${user.email}`);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[POST /api/auth/register] Error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    console.log(`[auth] ✅ User logged in — ${user.email}`);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[POST /api/auth/login] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal whether user exists
      return res.status(200).json({
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    // Generate and store OTP (10 min expiry)
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email (or log to console if no creds)
    await sendOtpEmail(user.email, otp);

    console.log(`[auth] 📧 OTP sent for password reset — ${user.email}`);

    return res.status(200).json({
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Check OTP expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check OTP match
    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    console.log(`[auth] ✅ OTP verified for — ${user.email}`);

    return res.status(200).json({
      message: 'OTP verified successfully.',
      verified: true,
    });
  } catch (err) {
    console.error('[POST /api/auth/verify-otp] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Verify OTP + expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Reset password (pre-save hook handles hashing)
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    console.log(`[auth] 🔒 Password reset successful — ${user.email}`);

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now login.',
    });
  } catch (err) {
    console.error('[POST /api/auth/reset-password] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me  (Protected)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Remove sensitive fields
    delete user.password;
    delete user.otp;
    delete user.otpExpiry;
    delete user.__v;

    return res.status(200).json(user);
  } catch (err) {
    console.error('[GET /api/auth/me] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/auth/profile (Protected)
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.fullName = fullName.trim();
    await user.save();

    console.log(`[auth] 👤 Profile updated — ${user.email} (${user.fullName})`);
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[PUT /api/auth/profile] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/auth/change-password (Protected)
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    console.log(`[auth] 🔐 Password changed successfully — ${user.email}`);
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[PUT /api/auth/change-password] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
