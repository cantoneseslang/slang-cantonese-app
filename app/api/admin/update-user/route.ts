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

    // usersテーブルが存在する場合は直接更新、存在しない場合はuser_metadata経由で更新
    const updates: any = {};
    if (username !== undefined) {
      updates.username = username.trim() || null;
    }
    if (membership_type !== undefined) {
      updates.membership_type = membership_type;
    }

    // まずusersテーブルへの更新を試行
    const { error: tableUpdateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user_id);

    // usersテーブルが存在しない場合、user_metadata経由で更新を試行
    if (tableUpdateError && (tableUpdateError.code === 'PGRST116' || tableUpdateError.message.includes('relation'))) {
      // user_metadata経由で更新（この方法は同じユーザー自身のみ可能）
      // 管理者が他のユーザーを更新する場合は、Supabase DashboardまたはAdmin APIが必要
      return NextResponse.json(
        { 
          success: false, 
          error: 'usersテーブルが存在しません。Supabase Dashboardから手動で更新するか、usersテーブルを作成してください。' 
        },
        { status: 500 }
      );
    }

    if (tableUpdateError) {
      console.error('ユーザー更新エラー:', tableUpdateError);
      return NextResponse.json(
        { success: false, error: tableUpdateError.message || 'ユーザー情報の更新に失敗しました' },
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

