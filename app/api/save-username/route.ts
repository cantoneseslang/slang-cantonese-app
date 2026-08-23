import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * メール新規登録時に user_usernames を更新（user_metadata と整合）。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, email } = body as {
      userId?: string;
      username?: string;
      email?: string;
    };

    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: 'userId, username, email が必要です' },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim();

    const row: Record<string, string> = {
      username: trimmedUsername,
      email: trimmedEmail,
    };
    row.user_id = userId;

    const { error } = await admin.from('user_usernames').upsert(row, {
      onConflict: 'username',
    });

    if (error) {
      // user_id 列が無い環境向けに再試行
      if (error.message?.includes('user_id') || error.code === 'PGRST204') {
        const { error: retryError } = await admin.from('user_usernames').upsert(
          { username: trimmedUsername, email: trimmedEmail },
          { onConflict: 'username' }
        );
        if (retryError) {
          console.error('save-username upsert:', retryError);
          return NextResponse.json(
            { error: retryError.message || 'ユーザーネームの保存に失敗しました' },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true });
      }
      console.error('save-username upsert:', error);
      return NextResponse.json(
        { error: error.message || 'ユーザーネームの保存に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ユーザーネームの保存に失敗しました';
    console.error('save-username:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
