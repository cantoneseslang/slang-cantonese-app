import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { wordChinese, categoryId } = await request.json()
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ isFavorite: false })
    }

    // お気に入りかどうかチェック
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('word_chinese', wordChinese)
      .eq('category_id', categoryId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('お気に入りチェックエラー:', error)
    }

    return NextResponse.json({ 
      isFavorite: !!data 
    })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({ isFavorite: false })
  }
}


