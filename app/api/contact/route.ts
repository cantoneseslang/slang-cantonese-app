import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const fromEmail = (body.email || '').toString()
    const message = (body.message || '').toString()
    const name = (body.name || '').toString()

    if (!fromEmail || !message) {
      return NextResponse.json({ success: false, error: 'メールアドレスと本文は必須です' }, { status: 400 })
    }

    const user = process.env.TITAN_SMTP_USER // 例: info@lifesupporthk.com
    const pass = process.env.TITAN_SMTP_PASS
    const to = process.env.CONTACT_TO || user
    if (!user || !pass || !to) {
      return NextResponse.json({ success: false, error: 'メール送信設定が不足しています' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.titan.email',
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user, pass }
    })

    const subject = `[お問い合わせ] ${name || fromEmail}`
    const text = `From: ${name ? `${name} <${fromEmail}>` : fromEmail}\n\n${message}`

    await transporter.sendMail({
      from: user,
      to,
      replyTo: fromEmail,
      subject,
      text
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}


