import nodemailer from 'nodemailer';

export async function sendSupportMail(options: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}) {
  const smtpPassword = process.env.TITAN_SMTP_PASS;
  if (!smtpPassword) {
    throw new Error('メール送信設定が完了していません');
  }

  const fromAddress = process.env.SMTP_FROM || process.env.TITAN_SMTP_USER || 'info@lifesupporthk.com';
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.TITAN_SMTP_USER || 'info@lifesupporthk.com',
      pass: smtpPassword,
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"カントン語音れん！" <${fromAddress}>`,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
}

export function supportInboxAddress() {
  return process.env.CONTACT_TO || 'info@lifesupporthk.com';
}
