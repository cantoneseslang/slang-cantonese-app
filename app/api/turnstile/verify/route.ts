import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || '');
  if (!token) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ success: false }, { status: 503 });
  }
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = await result.json().catch(() => ({ success: false }));
  if (!data.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
