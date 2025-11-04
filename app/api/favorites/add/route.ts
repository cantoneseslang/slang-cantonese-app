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

    const supabase = createClient();
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
    const { categoryId, wordChinese, wordJapanese } = body;
    
    if (!categoryId || !wordChinese) {
      return NextResponse.json({ error: 'categoryId and wordChinese are required' }, { status: 400 });
    }
    
    // 会員種別をチェックして制限を適用
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('membership_type')
      .eq('id', user.id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('User data fetch error:', userError);
      // usersテーブルが存在しない場合はデフォルトで'free'とする
    }
    
    const membershipType = userData?.membership_type || 'free';
    
    if (membershipType === 'free') {
      // ブロンズ会員は6個まで
      const { count, error: countError } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (countError) {
      if (countError.code === 'PGRST116' || countError.message.includes('relation') || countError.message.includes('schema')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでuser_favoritesテーブルを作成する必要があります。'
        }, { status: 500 });
      }
        throw countError;
      }
      
      if (count && count >= 6) {
        return NextResponse.json({
          error: 'ブロンズ会員は6個までしかお気に入りを登録できません。',
          limitReached: true
        }, { status: 403 });
      }
    }
    
    // 既に登録されているかチェック
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('word_chinese', wordChinese)
      .maybeSingle();
    
    if (checkError) {
      if (checkError.code === 'PGRST116' || checkError.message.includes('relation') || checkError.message.includes('schema')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでfavoritesテーブルを作成する必要があります。docs/favorites-table.sqlを実行してください。'
        }, { status: 500 });
      }
      throw checkError;
    }
    
    if (existing) {
      return NextResponse.json({ error: '既にお気に入りに登録されています' }, { status: 409 });
    }
    
    // お気に入りを追加
    const insertData: any = {
      user_id: user.id,
      category_id: categoryId,
      word_chinese: wordChinese
    };
    
    // word_japaneseが存在する場合は追加
    if (wordJapanese) {
      insertData.word_japanese = wordJapanese;
    }
    
    const { data: insertData_result, error: insertError } = await supabase
      .from('user_favorites')
      .insert(insertData)
      .select();
    
    if (insertError) {
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        insertData
      });
      
      if (insertError.code === 'PGRST116' || insertError.message.includes('relation') || insertError.message.includes('schema') || insertError.message.includes('Could not find')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          requiresTable: true,
          details: 'Supabaseでuser_favoritesテーブルを作成する必要があります。',
          errorCode: insertError.code,
          errorMessage: insertError.message
        }, { status: 500 });
      }
      
      // RLSポリシーエラーの可能性
      if (insertError.code === '42501' || insertError.message.includes('permission') || insertError.message.includes('policy')) {
        return NextResponse.json({
          error: 'Permission denied',
          details: 'RLS（Row Level Security）ポリシーが設定されていない可能性があります。SupabaseでRLSポリシーを設定してください。',
          errorCode: insertError.code,
          errorMessage: insertError.message
        }, { status: 500 });
      }
      
      throw insertError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    // エラーオブジェクトの詳細情報を取得
    const errorInfo: any = {
      message: errorMessage,
    };
    
    if (error && typeof error === 'object') {
      if ('code' in error) errorInfo.code = (error as any).code;
      if ('details' in error) errorInfo.details = (error as any).details;
      if ('hint' in error) errorInfo.hint = (error as any).hint;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add favorite', 
        details: errorMessage,
        errorInfo: errorInfo,
        stack: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

