import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 管理者によるユーザー情報更新API
export async function POST(request: Request) {
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
        error: 'ユーザーIDが必要です'
      }, { status: 400 });
    }

    // 更新するデータを準備
    const updates: any = {};
    if (username !== undefined) {
      updates.username = username.trim() || null;
    }
    if (membership_type !== undefined) {
      updates.membership_type = membership_type;
    }

    // サービスロールキーを使用して他のユーザーの情報を更新
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: '環境変数が設定されていません',
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }
    
    try {
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

      // 管理者APIを使用してユーザー情報を更新
      const { data, error } = await adminSupabase.auth.admin.updateUserById(
        user_id,
        {
          user_metadata: updates
        }
      );

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
          details: JSON.stringify(error)
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'ユーザー情報を更新しました',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || null,
          membership_type: data.user.user_metadata?.membership_type || null
        }
      });
    } catch (error: any) {
      console.error('Supabase更新エラー:', error);
      return NextResponse.json({
        success: false,
        error: 'ユーザー情報の更新に失敗しました',
        details: error.message || String(error),
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('APIエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      details: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
