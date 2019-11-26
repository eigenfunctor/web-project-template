import { createTransport, Transporter } from "nodemailer";

export function createEmailTransport() {
  if (!process.env.SMTP_HOST) {
    console.warn("WARNING: Please set the SMTP_HOST environment variable.");
    return;
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
  if (!(process.env.SMTP_HOST && process.env.SMTP_PORT)) {
    console.warn(
      "WARNING: Please set the SMTP_HOST and SMTP_PORT environment variables."
    );
    return;
  }

  if (!process.env.APP_BASE_URL) {
    console.warn("WARNING: Please set the APP_BASE_URL environment variable.");
    return;
  }

  const transporter = createEmailTransport();

  const { email, subject, text, html } = params;

  if (!/^.+\@.+$/g.test(email)) {
    return;
  }

  return await transporter.sendMail({
    from: `"NO REPLY" <noreply@${process.env.EMAIL_DOMAIN || "localhost"}>`,
    to: email,
    subject,
    text,
    html
  });
}
