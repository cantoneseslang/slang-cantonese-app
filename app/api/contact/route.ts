import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/** Grok Bot email trigger. Prefer BCC on the same SMTP send; fallback is a second copy. */
const GROK_BOT_CONTACT_BCC = 'hsakon+otoren@mail.grokbot.com';

function grokBotWebhookAuthorization(value: string): string {
  // Full header value already includes a scheme (e.g. "Bearer xxx").
  if (/^[A-Za-z][\w+.-]*\s+\S/.test(value)) return value;
  return `Bearer ${value}`;
}

/** Optional webhook notify. Failures are logged and must not fail the contact response. */
async function notifyGrokBotWebhook(payload: {
  name: string;
  email: string;
  message: string;
}) {
  const url = process.env.GROK_BOT_WEBHOOK_URL;
  if (!url) return;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const auth = process.env.GROK_BOT_WEBHOOK_KEY || process.env.GROK_BOT_WEBHOOK_AUTH;
    if (auth) {
      headers.Authorization = grokBotWebhookAuthorization(auth);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        at: new Date().toISOString(),
        source: 'slang-cantonese-contact',
      }),
    });

    if (!res.ok) {
      console.error('Grok Bot webhook notify failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (error) {
    console.error('Grok Bot webhook notify failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      );
    }

    // TITANメール設定を使用してメール送信
    // TITANのSMTP設定（SSL/TLS Port: 465）
    const smtpHost = process.env.SMTP_HOST || 'smtp.titan.email';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465'); // TITANはポート465（SSL/TLS）
    const smtpUser = process.env.TITAN_SMTP_USER || 'info@lifesupporthk.com';
    const smtpPassword = process.env.TITAN_SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || process.env.TITAN_SMTP_USER || 'info@lifesupporthk.com';
    const smtpTo = process.env.CONTACT_TO || 'info@lifesupporthk.com';

    if (!smtpPassword) {
      console.error('SMTP_PASSWORD環境変数が設定されていません');
      console.error('設定が必要な環境変数:', {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_USER: smtpUser,
        SMTP_FROM: smtpFrom,
        SMTP_TO: smtpTo,
        SMTP_PASSWORD: '***未設定***'
      });
      return NextResponse.json(
        { error: 'メール送信設定が完了していません。管理者にお問い合わせください。' },
        { status: 500 }
      );
    }

    // メール本文の作成
    const emailSubject = `お問い合わせ: ${name}様より`;
    const emailBody = `
お問い合わせフォームより以下の内容が送信されました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お名前】
${name}

【メールアドレス】
${email}

【お問い合わせ内容】
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
`;

    // TITAN SMTPを使用してメール送信（SSL/TLS Port: 465）
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true, // TITANはポート465でSSL/TLSを使用
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        // SSL/TLS証明書の検証を適切に設定
        rejectUnauthorized: false // 開発環境用（本番環境では適切な証明書設定を推奨）
      }
    });

    const mailOptions = {
      from: `"${name}" <${smtpFrom}>`,
      to: smtpTo,
      bcc: GROK_BOT_CONTACT_BCC,
      replyTo: email,
      subject: emailSubject,
      text: emailBody,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (bccError) {
      // Titan may reject BCC. Keep CONTACT_TO delivery, then try a notify-only copy.
      console.error('SMTP send with BCC failed, retrying without BCC:', bccError);
      const primaryMail = {
        from: mailOptions.from,
        to: mailOptions.to,
        replyTo: mailOptions.replyTo,
        subject: mailOptions.subject,
        text: mailOptions.text,
      };
      await transporter.sendMail(primaryMail);
      try {
        await transporter.sendMail({ ...primaryMail, to: GROK_BOT_CONTACT_BCC });
      } catch (notifyError) {
        console.error('Grok Bot BCC notify failed:', notifyError);
      }
    }

    console.log('メール送信成功:', { to: smtpTo, subject: emailSubject });

    await notifyGrokBotWebhook({ name, email, message });

    return NextResponse.json({ 
      success: true,
      message: 'お問い合わせを受け付けました。ありがとうございます。'
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    return NextResponse.json(
      { error: '送信に失敗しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    );
  }
}





