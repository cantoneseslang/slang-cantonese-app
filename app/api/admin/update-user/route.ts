import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 管理者がユーザー情報を更新するAPI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '認証が必要です'
      }, { status: 401 });
    }

    // 管理者チェック
    const adminEmails = ['bestinksalesman@gmail.com'];
    const isAdmin = 
      adminEmails.includes(user.email || '') ||
      user.user_metadata?.is_admin === true;

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: '管理者権限が必要です'
      }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, username, membership_type } = body;

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'user_idが必要です'
      }, { status: 400 });
    }

    // サービスロールキーが設定されている場合は、それを使用してユーザー情報を更新
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase設定が不足しています'
      }, { status: 500 });
    }

    try {
      // サービスロールキーを使用してSupabaseクライアントを作成
      const adminSupabase = createAdminClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // ユーザーのメタデータを更新
      const { data: { user: targetUser }, error: getUserError } = await adminSupabase.auth.admin.getUserById(user_id);
      
      if (getUserError || !targetUser) {
        return NextResponse.json({
          success: false,
          error: 'ユーザーが見つかりません'
        }, { status: 404 });
      }

      const currentMetadata = targetUser.user_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...(username !== undefined && { username }),
        ...(membership_type !== undefined && { membership_type })
      };

      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user_id,
        {
          user_metadata: updatedMetadata
        }
      );

      if (updateError) {
        console.error('ユーザー更新エラー:', updateError);
        return NextResponse.json({
          success: false,
          error: 'ユーザー情報の更新に失敗しました',
          details: updateError.message
        }, { status: 500 });
      }

      // usersテーブルも更新（存在する場合）
      if (membership_type !== undefined) {
        const { error: tableError } = await adminSupabase
          .from('users')
          .upsert({
            id: user_id,
            email: targetUser.email,
            membership_type: membership_type,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (tableError && tableError.code !== 'PGRST116') {
          console.warn('usersテーブル更新エラー（無視）:', tableError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'ユーザー情報を更新しました'
      });
    } catch (error: any) {
      console.error('Supabase接続エラー（詳細）:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase接続エラーが発生しました',
        details: error.message || String(error)
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('APIエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      details: error.message || String(error)
    }, { status: 500 });
  }
}

