const transporter = require('../config/email');

/**
 * Send a generic email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    text: text || '',
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
  return sendEmail({
    to: email,
    subject: 'CareConnect — Verify Your Email',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#7C3AED">Welcome to CareConnect, ${name}!</h2>
        <p>Please verify your email address by clicking the button below.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#7C3AED;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  return sendEmail({
    to: email,
    subject: 'CareConnect — Reset Your Password',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#7C3AED">Password Reset Request</h2>
        <p>Hi ${name}, click the button below to reset your password.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#7C3AED;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Link expires in 1 hour. Ignore if you didn't request this.</p>
      </div>
    `,
  });
};

/**
 * Send booking confirmation email to user
 */
const sendBookingConfirmationEmail = async (email, name, booking) => {
  return sendEmail({
    to: email,
    subject: `CareConnect — Booking Confirmed (#${booking._id})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#7C3AED">Booking Confirmed!</h2>
        <p>Hi ${name}, your booking has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:600">Service</td><td>${booking.serviceType}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Start Date</td><td>${new Date(booking.startDate).toDateString()}</td></tr>
          <tr><td style="padding:8px;font-weight:600">End Date</td><td>${new Date(booking.endDate).toDateString()}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Total</td><td>$${booking.totalAmount}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Thank you for choosing CareConnect.</p>
      </div>
    `,
  });
};

/**
 * Send payment receipt email
 */
const sendPaymentReceiptEmail = async (email, name, payment) => {
  return sendEmail({
    to: email,
    subject: `CareConnect — Payment Receipt`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#7C3AED">Payment Successful</h2>
        <p>Hi ${name}, we've received your payment of <strong>$${payment.amount}</strong>.</p>
        <p>Transaction ID: <code>${payment.stripePaymentIntentId}</code></p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Thank you for choosing CareConnect.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
};
