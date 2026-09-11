const nodemailer = require('nodemailer');

/**
 * Send a 6-digit OTP to the specified email address.
 * Falls back to console logging if EMAIL_USER / EMAIL_PASS are not set.
 *
 * @param {string} toEmail — recipient address
 * @param {string} otp     — 6-digit OTP string
 * @returns {Promise<boolean>}
 */
async function sendOtpEmail(toEmail, otp) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // ── Fallback: no email credentials → log to console ──────────────────
  if (!emailUser || !emailPass) {
    console.log('════════════════════════════════════════════════');
    console.log(`📧 [OTP FALLBACK] Email: ${toEmail}`);
    console.log(`🔑 [OTP FALLBACK] Code:  ${otp}`);
    console.log('   (Set EMAIL_USER & EMAIL_PASS in .env to send real emails)');
    console.log('════════════════════════════════════════════════');
    return true;
  }

  // ── Real email via Nodemailer ────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const htmlBody = `
  <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:480px; margin:0 auto; padding:32px 24px; background:#0b0f19; border-radius:16px; border:1px solid #1e293b;">
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; width:48px; height:48px; background:linear-gradient(135deg,#3b82f6,#6366f1); border-radius:12px; line-height:48px; font-size:22px;">
        ⛽
      </div>
    </div>
    <h2 style="color:#f1f5f9; text-align:center; margin:0 0 8px; font-size:20px; font-weight:700;">
      Password Reset
    </h2>
    <p style="color:#94a3b8; text-align:center; margin:0 0 28px; font-size:14px; line-height:1.5;">
      Use the verification code below to reset your Gas Adviser password. This code expires in <strong style="color:#f1f5f9;">10 minutes</strong>.
    </p>
    <div style="background:#131b2e; border:1px solid #1e293b; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
      <span style="font-size:36px; font-weight:800; letter-spacing:12px; color:#3b82f6; font-family:'Courier New',monospace;">
        ${otp}
      </span>
    </div>
    <p style="color:#64748b; text-align:center; font-size:12px; line-height:1.5; margin:0;">
      If you didn't request this, you can safely ignore this email.<br/>
      — Gas Adviser Team
    </p>
  </div>`;

  const mailOptions = {
    from: `"Gas Adviser" <${emailUser}>`,
    to: toEmail,
    subject: `🔑 Your Password Reset Code: ${otp}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[email] ✅ OTP sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[email] ❌ Failed to send OTP to ${toEmail}:`, err.message);
    // Still return true so the API doesn't leak whether email exists
    return false;
  }
}

/**
 * Sends an email alert to the user when gas fees hit or drop below their target.
 * @param {string} toEmail - Recipient email
 * @param {object} alertDetails - { chain, thresholdGwei, currentGwei }
 * @returns {Promise<boolean>}
 */
async function sendGasAlertEmail(toEmail, alertDetails) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log(`📧 [ALERT EMAIL LOG] To: ${toEmail} | Target: ≤ ${alertDetails.thresholdGwei} Gwei | Current: ${alertDetails.currentGwei} Gwei`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const htmlBody = `
  <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:520px; margin:0 auto; padding:32px 24px; background:#0c0c0e; border-radius:16px; border:1px solid #27272a; color:#f4f4f5;">
    <div style="text-align:center; margin-bottom:20px;">
      <div style="display:inline-block; width:52px; height:52px; background:linear-gradient(135deg,#10b981,#059669); border-radius:14px; line-height:52px; font-size:26px; text-align:center;">
        ⚡
      </div>
    </div>
    <h2 style="color:#ffffff; text-align:center; margin:0 0 8px; font-size:22px; font-weight:700;">
      Gas Price Target Reached!
    </h2>
    <p style="color:#a1a1aa; text-align:center; margin:0 0 24px; font-size:14px; line-height:1.5;">
      Ethereum gas fees have reached your target threshold.
    </p>
    
    <div style="background:#141417; border:1px solid #27272a; border-radius:12px; padding:20px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed #27272a; padding-bottom:12px;">
        <span style="color:#a1a1aa; font-size:13px;">Target Threshold:</span>
        <strong style="color:#ffffff; font-size:14px;">≤ ${alertDetails.thresholdGwei} Gwei</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed #27272a; padding-bottom:12px;">
        <span style="color:#a1a1aa; font-size:13px;">Current Market Rate:</span>
        <strong style="color:#10b981; font-size:16px;">${alertDetails.currentGwei} Gwei</strong>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#a1a1aa; font-size:13px;">Network:</span>
        <span style="color:#ffffff; font-size:13px; text-transform:capitalize;">${alertDetails.chain || 'Ethereum Mainnet'}</span>
      </div>
    </div>

    <div style="text-align:center; margin-bottom:24px;">
      <p style="color:#a1a1aa; font-size:13px; line-height:1.5; margin:0 0 16px;">
        Now is an optimal window for low-fee DEX swaps, NFT minting, or contract executions.
      </p>
      <a href="http://localhost:5173" style="display:inline-block; background:#ffffff; color:#09090b; font-weight:700; font-size:13px; text-decoration:none; padding:10px 24px; border-radius:8px;">
        View Live Dashboard &rarr;
      </a>
    </div>

    <p style="color:#71717a; text-align:center; font-size:11px; line-height:1.5; margin:0; border-top:1px solid #1f1f23; padding-top:16px;">
      You received this notification because you created a gas price alert on Gas Adviser.<br/>
      Gas Adviser &copy; ${new Date().getFullYear()}
    </p>
  </div>`;

  const mailOptions = {
    from: `"DeFi Gas Adviser" <${emailUser}>`,
    to: toEmail,
    subject: `🔔 Gas Alert: Ethereum Gas is now ${alertDetails.currentGwei} Gwei (Target: ≤ ${alertDetails.thresholdGwei} Gwei)`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[email] 🔔 Gas alert email sent successfully to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[email] ❌ Failed to send gas alert email to ${toEmail}:`, err.message);
    return false;
  }
}

/**
 * Generate a random 6-digit OTP string.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendOtpEmail, sendGasAlertEmail, generateOtp };

