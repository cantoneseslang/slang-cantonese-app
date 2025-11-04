import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select('category_id, word_chinese')
      .eq('user_id', user.id);
    
    if (error) {
      // テーブルが存在しない場合など
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('schema')) {
        return NextResponse.json({
          favorites: [],
          error: 'Favorites table not found',
          details: 'Please create the favorites table in Supabase. See docs/favorites-table.sql'
        });
      }
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

