import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 環境変数のチェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase環境変数が設定されていません');
      return NextResponse.json({
        favorites: [],
        error: 'Supabase configuration error'
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ favorites: [] });
    }
    
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select('category_id, word_chinese')
      .eq('user_id', user.id);
    
    if (error) {
      // テーブルが存在しない場合など
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('schema') || error.message.includes('Could not find')) {
        return NextResponse.json({
          favorites: [],
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでfavoritesテーブルを作成する必要があります。docs/favorites-table.sqlを実行してください。'
        });
      }
      console.error('Error fetching favorites:', error);
      throw error;
    }
    
    const favorites = (data || []).map(item => `${item.category_id}:${item.word_chinese}`);
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { favorites: [], error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

