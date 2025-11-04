import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { categoryId, wordChinese } = body;
    
    if (!categoryId || !wordChinese) {
      return NextResponse.json({ error: 'categoryId and wordChinese are required' }, { status: 400 });
    }
    
    // 会員種別をチェックして制限を適用
    const { data: userData } = await supabase
      .from('users')
      .select('membership_type')
      .eq('id', user.id)
      .single();
    
    const membershipType = userData?.membership_type || 'free';
    
    if (membershipType === 'free') {
      // ブロンズ会員は6個まで
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (count && count >= 6) {
        return NextResponse.json({
          error: 'ブロンズ会員は6個までしかお気に入りを登録できません。',
          limitReached: true
        }, { status: 403 });
      }
    }
    
    // 既に登録されているかチェック
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('word_chinese', wordChinese)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: '既にお気に入りに登録されています' }, { status: 409 });
    }
    
    // お気に入りを追加
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        word_chinese: wordChinese
      });
    
    if (insertError) {
      if (insertError.code === 'PGRST116' || insertError.message.includes('relation') || insertError.message.includes('schema')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          details: 'Please create the favorites table in Supabase. See docs/favorites-table.sql'
        }, { status: 500 });
      }
      throw insertError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

