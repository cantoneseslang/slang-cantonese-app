import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendSupportMail, supportInboxAddress } from '@/lib/support-mail';

export const maxDuration = 30;

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const { data, error } = await adminClient()
    .from('support_messages')
    .select('id, body, direction, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: '連絡を読み込めませんでした' }, { status: 500 });
  }

  return NextResponse.json({ success: true, messages: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message || message.length > 2000) {
    return NextResponse.json({ success: false, error: '2000文字以内で書いてください' }, { status: 400 });
  }

  const username = String(user.user_metadata?.username || '').trim() || '未設定';
  const email = user.email || '';
  const db = adminClient();
  const { data: saved, error } = await db
    .from('support_messages')
    .insert({
      user_id: user.id,
      username,
      email,
      body: message,
      direction: 'user',
    })
    .select('id, body, direction, created_at')
    .single();

  if (error || !saved) {
    return NextResponse.json({ success: false, error: '保存できませんでした' }, { status: 500 });
  }

  try {
    await sendSupportMail({
      to: supportInboxAddress(),
      replyTo: email || undefined,
      subject: '【カントン語音れん！】ユーザーよりコンタクト',
      text: [
        'カントン語音れん！のユーザーから連絡が届きました。',
        '',
        `ユーザーネーム: ${username}`,
        `メールアドレス: ${email || 'なし'}`,
        '',
        '内容:',
        message,
        '',
        `送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Hong_Kong' })}`,
      ].join('\n'),
    });
  } catch (mailError) {
    await db.from('support_messages').delete().eq('id', saved.id);
    console.error('support mail failed', mailError);
    return NextResponse.json({ success: false, error: 'メールを送れませんでした' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: saved });
}
