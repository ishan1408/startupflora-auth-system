const nodemailer = require('nodemailer');
require('dotenv').config();

function generateOTP(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
}

async function sendOTPEmail(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #2d89ef;">StartupFlora OTP Verification</h2>
      <p>Dear User,</p>
      <p>Use the following OTP to reset your password:</p>
      <h3 style="color: #e91e63;">${otp}</h3>
      <p>This OTP is valid for 15 minutes. Please do not share it with anyone.</p>
      <br/>
      <p>Regards,</p>
      <strong>StartupFlora Security Team</strong>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"StartupFlora Auth System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your OTP for Password Reset',
      html: htmlTemplate
    });
    console.log(`📧 OTP email sent to ${toEmail}`);
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err.message);
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail
};
