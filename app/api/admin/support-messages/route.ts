import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendSupportMail } from '@/lib/support-mail';

export const maxDuration = 30;

const adminEmails = ['bestinksalesman@gmail.com'];

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !adminEmails.includes(user.email || '')) {
    return null;
  }
  return user;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
  }

  const { data, error } = await adminClient()
    .from('support_messages')
    .select('id, user_id, username, email, body, direction, created_at')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json({ success: false, error: '連絡を読み込めませんでした' }, { status: 500 });
  }

  return NextResponse.json({ success: true, messages: data || [] });
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || '');
  const message = String(body.message || '').trim();
  if (!userId || !message || message.length > 2000) {
    return NextResponse.json({ success: false, error: '返信内容が不正です' }, { status: 400 });
  }

  const db = adminClient();
  const { data: authData, error: userError } = await db.auth.admin.getUserById(userId);
  if (userError || !authData.user) {
    return NextResponse.json({ success: false, error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  const email = authData.user.email || '';
  const username = String(authData.user.user_metadata?.username || '').trim() || email || '未設定';
  const { data: saved, error } = await db
    .from('support_messages')
    .insert({
      user_id: userId,
      username,
      email,
      body: message,
      direction: 'staff',
    })
    .select('id, user_id, username, email, body, direction, created_at')
    .single();

  if (error || !saved) {
    return NextResponse.json({ success: false, error: '返信を保存できませんでした' }, { status: 500 });
  }

  if (email) {
    try {
      await sendSupportMail({
        to: email,
        subject: '【カントン語音れん！】スラング先生からの返信',
        text: [
          `${username} さん`,
          '',
          'スラング先生から返信が届きました。',
          '',
          message,
          '',
          'アプリの設定画面にも同じ返信を表示しています。',
        ].join('\n'),
      });
    } catch (mailError) {
      console.error('support reply mail failed', mailError);
      return NextResponse.json({
        success: true,
        message: saved,
        mailed: false,
        error: '画面には返信を出しましたが、メール送信に失敗しました',
      });
    }
  }

  return NextResponse.json({ success: true, message: saved, mailed: Boolean(email) });
}
