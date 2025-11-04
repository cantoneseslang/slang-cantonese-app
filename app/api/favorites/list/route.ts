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

    let supabase;
    try {
      supabase = createClient();
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      return NextResponse.json({
        favorites: [],
        error: 'Failed to create Supabase client',
        details: clientError instanceof Error ? clientError.message : String(clientError),
        debug: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ favorites: [] });
    }
    
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }
    
    const { data, error } = await supabase
      .from('user_favorites')
      .select('category_id, word_chinese')
      .eq('user_id', user.id);
    
    if (error) {
      // テーブルが存在しない場合など
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('schema') || error.message.includes('Could not find')) {
        return NextResponse.json({
          favorites: [],
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでuser_favoritesテーブルを作成する必要があります。'
        });
      }
      console.error('Error fetching favorites:', error);
      throw error;
    }
    
    const favorites = (data || []).map(item => `${item.category_id}:${item.word_chinese}`);
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorInfo: any = {};
    
    if (error && typeof error === 'object') {
      if ('code' in error) errorInfo.code = (error as any).code;
      if ('details' in error) errorInfo.details = (error as any).details;
      if ('hint' in error) errorInfo.hint = (error as any).hint;
      if ('message' in error) errorInfo.fullMessage = (error as any).message;
    }
    
    return NextResponse.json(
      { 
        favorites: [], 
        error: 'Failed to fetch favorites',
        errorInfo: errorInfo,
        debug: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          errorType: error?.constructor?.name || typeof error,
          errorString: String(error)
        }
      },
      { status: 500 }
    );
  }
}

