import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // お気に入りデータを取得（ユーザーごとの集計）
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('user_id');

    if (favoritesError) {
      // テーブルが存在しない場合は空配列を返す
      if (favoritesError.code === 'PGRST116' || favoritesError.message.includes('relation')) {
        return NextResponse.json({
          success: true,
          favorites: [],
          total_users: 0,
          total_favorites: 0
        });
      }
      throw favoritesError;
    }

    // ユーザーごとのお気に入り数を集計
    const favoritesCountMap: Record<string, number> = {};
    (favorites || []).forEach((fav: any) => {
      favoritesCountMap[fav.user_id] = (favoritesCountMap[fav.user_id] || 0) + 1;
    });

    // フォーマット
    const favoritesList = Object.entries(favoritesCountMap).map(([user_id, favorites_count]) => ({
      user_id,
      favorites_count
    }));

    return NextResponse.json({
      success: true,
      favorites: favoritesList,
      total_users: favoritesList.length,
      total_favorites: favorites?.length || 0
    });
  } catch (error: any) {
    console.error('お気に入りデータ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'お気に入りデータの取得に失敗しました',
        favorites: [],
        total_users: 0,
        total_favorites: 0
      },
      { status: 500 }
    );
  }
}

