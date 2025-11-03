import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 管理者が全ユーザーのお気に入りデータを取得するAPI
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '認証が必要です'
      }, { status: 401 })
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
      }, { status: 403 })
    }

    // サービスロールキーが設定されている場合は、それを使用して全お気に入りデータを取得
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Supabase URLが設定されていません'
      }, { status: 500 })
    }
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'サービスロールキーが設定されていません'
      }, { status: 500 })
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

      // 全ユーザーのお気に入りデータを取得（ユーザー情報も含める）
      const { data: favorites, error: listError } = await adminSupabase
        .from('user_favorites')
        .select('*')
        .order('created_at', { ascending: false })

      if (listError) {
        console.error('お気に入り取得エラー:', listError);
        // テーブルが存在しない場合は空配列を返す
        if (listError.code === 'PGRST116' || listError.message?.includes('relation') || listError.message?.includes('does not exist')) {
          return NextResponse.json({ 
            success: true, 
            favorites: [],
            message: 'お気に入りテーブルが存在しません。Supabaseでテーブルを作成してください。'
          })
        }
        return NextResponse.json({
          success: false,
          error: 'お気に入りデータの取得に失敗しました',
          details: listError.message
        }, { status: 500 })
      }

      // ユーザーごとに集計
      const userFavoritesMap: { [userId: string]: any[] } = {};
      (favorites || []).forEach((favorite: any) => {
        const userId = favorite.user_id;
        if (!userFavoritesMap[userId]) {
          userFavoritesMap[userId] = [];
        }
        userFavoritesMap[userId].push({
          word_chinese: favorite.word_chinese,
          word_japanese: favorite.word_japanese,
          category_id: favorite.category_id,
          created_at: favorite.created_at
        });
      });

      // ユーザー情報も取得して結合
      const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
      
      const userFavoritesWithInfo = Object.keys(userFavoritesMap).map(userId => {
        const user = users?.find(u => u.id === userId);
        return {
          user_id: userId,
          email: user?.email || '不明',
          username: user?.user_metadata?.username || null,
          membership_type: user?.user_metadata?.membership_type || 'free',
          favorites_count: userFavoritesMap[userId].length,
          favorites: userFavoritesMap[userId]
        };
      });

      return NextResponse.json({
        success: true,
        favorites: userFavoritesWithInfo,
        total_users: userFavoritesWithInfo.length,
        total_favorites: favorites?.length || 0
      })
    } catch (error: any) {
      console.error('Supabase接続エラー（詳細）:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase接続エラーが発生しました',
        details: error.message || String(error)
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('APIエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      details: error.message || String(error)
    }, { status: 500 })
  }
}
