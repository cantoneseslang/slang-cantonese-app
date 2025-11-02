import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 管理者のみアクセス可能なユーザー一覧取得API
export async function GET() {
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

    // サービスロールキーが設定されている場合は、それを使用して全ユーザーを取得
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // 環境変数の確認
    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Supabase URLが設定されていません',
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'サービスロールキーが設定されていません',
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: false,
          message: '環境変数 SUPABASE_SERVICE_ROLE_KEY が設定されていません'
        }
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

      // 全ユーザー情報を取得
      const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();

      if (listError) {
        console.error('Supabase接続エラー:', listError);
        return NextResponse.json({
          success: false,
          error: 'ユーザー一覧の取得に失敗しました',
          details: listError.message,
          code: listError.status,
          debug: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceRoleKey,
            urlLength: supabaseUrl?.length,
            keyLength: serviceRoleKey?.length
          }
        }, { status: 500 });
      }

      // ユーザー情報を整形
      const formattedUsers = users.map(u => ({
        id: u.id,
        email: u.email || '',
        username: u.user_metadata?.username || null,
        membership_type: u.user_metadata?.membership_type || null,
        has_password: !!u.identities?.find((i: any) => i.provider === 'email'),
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        updated_at: u.updated_at
      }));

      return NextResponse.json({
        success: true,
        users: formattedUsers
      });
    } catch (error: any) {
      console.error('Supabase接続エラー（詳細）:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase接続エラーが発生しました',
        details: error.message || String(error),
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey,
          url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
          keyPrefix: serviceRoleKey ? serviceRoleKey.substring(0, 10) : null
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
