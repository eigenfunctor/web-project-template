import { createTransport, Transporter } from "nodemailer";

export function createEmailTransport() {
  if (!process.env.SMTP_HOST) {
    throw new Error("Please set the SMTP_HOST environment variable.");
  }

  return createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.NODE_ENV === "production"
  });
}

export async function sendEmail(params: {
  email: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!process.env.APP_BASE_URL) {
    throw new Error("Please set the APP_BASE_URL environment variable.");
  }

  const transporter = createEmailTransport();

  const { email, subject, text, html } = params;

  return await transporter.sendMail({
    from: `"NO REPLY" <noreply@${process.env.EMAIL_DOMAIN || "localhost"}>`,
    to: email,
    subject,
    text,
    html
  });
}
