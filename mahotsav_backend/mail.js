const nodemailer = require("nodemailer");

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: String(process.env.SMTP_USER).trim(),
          pass: String(process.env.SMTP_PASS || "").replace(/^["']|["']$/g, ""),
        }
      : undefined,
  });
}

async function sendContactMail({ to, siteName, name, email, phone, message }) {
  const mailer = transport();
  if (!mailer || !to) return false;
  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || to,
    to,
    replyTo: email || undefined,
    subject: `Contact Us: ${name} — ${siteName || "Banki Mahotsav"}`,
    text: `A message was submitted from the public Contact page.\n\nName: ${name}\nEmail: ${email || "-"}\nPhone: ${phone || "-"}\n\n${message}`,
  });
  return true;
}

module.exports = { sendContactMail };
