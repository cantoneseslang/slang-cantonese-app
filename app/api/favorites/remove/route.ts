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
    
    // お気に入りを削除
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('word_chinese', wordChinese);
    
    if (deleteError) {
      if (deleteError.code === 'PGRST116' || deleteError.message.includes('relation') || deleteError.message.includes('schema')) {
        return NextResponse.json({
          error: 'Favorites table not found',
          details: 'Please create the favorites table in Supabase. See docs/favorites-table.sql'
        }, { status: 500 });
      }
      throw deleteError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

