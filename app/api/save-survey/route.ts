import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const GENDERS = new Set(['男性', '女性', '答えたくない']);
const LEVELS = new Set(['初心者', '中級者', '上級者']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNUP_WINDOW_MS = 2 * 60 * 60 * 1000;

function isValidResidence(r: string): boolean {
  const s = r.trim();
  if (s === '海外') return true;
  if (s === '北海道') return true;
  return s.endsWith('県') || s.endsWith('府') || s.endsWith('都');
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, residence, residenceOther, cantoneseLevel, userId: bodyUserId, email: bodyEmail } = body as {
      gender?: string;
      residence?: string;
      residenceOther?: string | null;
      cantoneseLevel?: string;
      userId?: string;
      email?: string;
    };

    if (!gender || !GENDERS.has(gender)) {
      return NextResponse.json({ error: '性別の値が不正です' }, { status: 400 });
    }
    if (!residence || typeof residence !== 'string' || !isValidResidence(residence)) {
      return NextResponse.json({ error: '居住地の値が不正です' }, { status: 400 });
    }
    if (!cantoneseLevel || !LEVELS.has(cantoneseLevel)) {
      return NextResponse.json({ error: '広東語レベルの値が不正です' }, { status: 400 });
    }
    if (residence === '海外' && !(residenceOther && String(residenceOther).trim())) {
      return NextResponse.json({ error: '海外の場合は詳細を入力してください' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 });
    }

    let targetUser = user && !authError ? user : null;

    if (!targetUser) {
      const signupUserId = typeof bodyUserId === 'string' ? bodyUserId.trim() : '';
      if (!UUID_RE.test(signupUserId)) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }

      const { data: fetched, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(signupUserId);
      const pending = fetched?.user;
      if (fetchError || !pending) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }

      const createdAt = new Date(pending.created_at).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > SIGNUP_WINDOW_MS) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }

      const pendingEmail = (pending.email || '').toLowerCase();
      const submittedEmail = typeof bodyEmail === 'string' ? bodyEmail.trim().toLowerCase() : '';
      if (submittedEmail && pendingEmail && submittedEmail !== pendingEmail) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }

      targetUser = pending;
    }

    if (targetUser.user_metadata?.survey_completed === true) {
      return NextResponse.json({ success: true, alreadySaved: true });
    }

    const updatedMetadata = {
      ...(targetUser.user_metadata || {}),
      survey_gender: gender,
      survey_residence: residence.trim(),
      survey_residence_other:
        residence === '海外' && residenceOther ? String(residenceOther).trim() : null,
      survey_cantonese_level: cantoneseLevel,
      survey_completed: true,
      survey_completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      user_metadata: updatedMetadata,
    });

    if (updateError) {
      console.error('save-survey updateUserById:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'アンケートの保存に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'アンケートの保存に失敗しました';
    console.error('save-survey:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
