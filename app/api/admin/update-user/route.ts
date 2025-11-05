import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    // Service Role Keyを使ってAdmin APIでユーザーを更新
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service Role Keyが設定されていません' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // user_metadataを更新
    const userMetadataUpdates: any = {};
    if (username !== undefined) {
      userMetadataUpdates.username = username.trim() || null;
    }
    if (membership_type !== undefined) {
      userMetadataUpdates.membership_type = membership_type;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { user_metadata: userMetadataUpdates }
    );

    if (updateError) {
      console.error('ユーザー更新エラー:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'ユーザー情報の更新に失敗しました' },
        { status: 500 }
      );
    }

    // usersテーブルが存在する場合は、そちらも更新
    const updates: any = {};
    if (username !== undefined) {
      updates.username = username.trim() || null;
    }
    if (membership_type !== undefined) {
      updates.membership_type = membership_type;
    }

    const { error: tableUpdateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user_id);

    // usersテーブルが存在しない場合は警告のみ（user_metadataは更新済み）
    if (tableUpdateError && (tableUpdateError.code === 'PGRST116' || tableUpdateError.message.includes('relation'))) {
      console.warn('usersテーブルが存在しないため、user_metadataのみ更新しました');
    } else if (tableUpdateError) {
      console.error('usersテーブル更新エラー:', tableUpdateError);
      // user_metadataは更新済みなので、エラーは無視
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

