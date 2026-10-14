import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';
const EMAIL_FROM = process.env.EMAIL_FROM || 'I Care Gadget <admin@icaregadget.store>';
const FALLBACK_EMAIL = process.env.FALLBACK_EMAIL || 'malikazan8768@gmail.com';

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail(toEmail, code, action = 'ADMIN_LOGIN') {
  const isPasswordChange = action === 'CHANGE_PASSWORD';
  const subject = isPasswordChange 
    ? '🔐 I Care Gadget - Admin Password Change Code' 
    : '🔐 I Care Gadget - Admin Login Verification Code';

  const actionText = isPasswordChange
    ? 'A request was received to change your Admin account password.'
    : 'A login attempt was made for the Admin Dashboard at I Care Gadget.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
        .header { background: #111827; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header span { color: #f97316; }
        .content { padding: 32px 24px; text-align: center; }
        .content p { color: #4b5563; font-size: 15px; line-height: 1.5; margin: 0 0 24px; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 8px; padding: 18px 24px; margin: 24px auto; display: inline-block; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #c2410c; font-family: monospace; }
        .footer { padding: 18px 24px; background: #f3f4f6; text-align: center; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>I CARE <span>GADGET</span></h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>${actionText}</p>
          <p>Use the 6-digit verification code below to proceed:</p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          <p style="font-size: 13px; color: #9ca3af; margin-top: 16px;">This code will expire in <strong>10 minutes</strong>. If you did not make this request, please change your password immediately.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} I Care Gadget Store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Always print code to terminal so Admin can never get locked out
  console.log(`\n=========================================================`);
  console.log(` 🔐 I CARE GADGET - VERIFICATION CODE`);
  console.log(` Code:       ${code}`);
  console.log(` Action:     ${action}`);
  console.log(` Recipient:  ${toEmail}`);
  console.log(` Expires:    10 minutes`);
  console.log(`=========================================================\n`);

  if (!RESEND_API_KEY) {
    console.warn('[WARN] No RESEND_API_KEY configured in .env. Code logged to console.');
    return { success: true, method: 'console_fallback' };
  }

  try {
    // 1. Try sending from custom domain email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [toEmail],
        subject,
        html
      })
    });

    const data = await res.json();

    if (res.ok && data.id) {
      console.log(`✅ Verification email sent to ${toEmail} (ID: ${data.id})`);
      return { success: true, id: data.id };
    }

    // 2. If domain is not verified yet in Resend, send to fallback email via onboarding@resend.dev
    console.warn(`[Resend notice]: ${data.message || JSON.stringify(data)}`);
    console.log(`Attempting fallback delivery to ${FALLBACK_EMAIL}...`);

    const fallbackRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [FALLBACK_EMAIL],
        subject: `[FORWARD FOR ${toEmail}] ${subject}`,
        html
      })
    });

    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.id) {
      console.log(`✅ Fallback verification email delivered to ${FALLBACK_EMAIL} (ID: ${fallbackData.id})`);
      return { success: true, id: fallbackData.id, note: 'delivered_to_fallback' };
    }

    console.error('❌ Resend fallback also failed:', fallbackData);
    return { success: false, error: data.message || fallbackData.message };
  } catch (err) {
    console.error('❌ Network error sending email via Resend:', err.message);
    return { success: false, error: err.message };
  }
}
