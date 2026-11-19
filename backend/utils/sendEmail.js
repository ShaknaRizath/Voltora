import nodemailer from 'nodemailer';

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

/**
 * Sends an email through SMTP. When SMTP isn't configured (typical on a dev machine) the
 * message is printed to the server console instead, so flows like password reset can still
 * be tested without any email account.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured');
    }
    console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${text}\n`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `Voltora <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
