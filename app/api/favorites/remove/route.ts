import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase環境変数が設定されていません');
      return NextResponse.json(
        { error: 'Supabase configuration error', details: '環境変数が設定されていません' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { categoryId, wordChinese } = body;
    
    if (!categoryId || !wordChinese) {
      return NextResponse.json({ error: 'categoryId and wordChinese are required' }, { status: 400 });
    }
    
    // お気に入りを削除
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('word_chinese', wordChinese);
    
    if (deleteError) {
      if (deleteError.code === 'PGRST116' || deleteError.message.includes('relation') || deleteError.message.includes('schema') || deleteError.message.includes('Could not find')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでfavoritesテーブルを作成する必要があります。docs/favorites-table.sqlを実行してください。'
        }, { status: 500 });
      }
      console.error('Delete error:', deleteError);
      throw deleteError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to remove favorite', details: errorMessage },
      { status: 500 }
    );
  }
}

