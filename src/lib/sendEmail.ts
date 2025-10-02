import nodemailer from "nodemailer";

type SendArgs = {
  subject: string;
  html: string;
};

export async function sendEmail({ subject, html }: SendArgs) {
  const to = process.env.CONTACT_EMAIL || "tooeasyparceldelivery@gmail.com";
  const from = process.env.MAIL_FROM || "website@tooeasy.local";

  // Prefer SMTP creds from env; if not present, fallback to nodemailer ethereal for dev
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === "true"),
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates in development
      },
    });
    await transporter.sendMail({ to, from, subject, html });
    return;
  }

  // Development-only: console output if SMTP not configured
  console.log("[sendEmail] SMTP not configured. Would send:", { to, from, subject, html });
}


