import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
      replyTo: email,
      subject: emailSubject,
      text: emailBody,
    };

    await transporter.sendMail(mailOptions);

    console.log('メール送信成功:', { to: smtpTo, subject: emailSubject });

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





