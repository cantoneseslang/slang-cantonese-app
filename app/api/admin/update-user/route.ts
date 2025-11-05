import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '管理者権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, username, membership_type } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_idが必要です' },
        { status: 400 }
      );
    }

    // ユーザーメタデータを更新
    const updates: any = {};
    if (username !== undefined) {
      updates.username = username.trim() || null;
    }
    if (membership_type !== undefined) {
      updates.membership_type = membership_type;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { user_metadata: updates }
    );

    if (updateError) {
      console.error('ユーザー更新エラー:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'ユーザー情報の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザー情報を更新しました'
    });
  } catch (error: any) {
    console.error('ユーザー更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'ユーザー情報の更新に失敗しました'
      },
      { status: 500 }
    );
  }
}

