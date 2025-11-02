import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // お気に入り一覧を取得
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('word_chinese, word_japanese, category_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('お気に入り取得エラー:', error)
      // テーブルが存在しない場合は空配列を返す（エラーを出さない）
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('no such table')) {
        return NextResponse.json({ 
          success: true, 
          favorites: [],
          favoriteSet: []
        })
      }
      // その他のエラーも静かに処理（空配列を返す）
      return NextResponse.json({ 
        success: true,
        favorites: [],
        favoriteSet: []
      })
    }

    // word_chineseとcategory_idの組み合わせをSetとして返す（高速検索用）
    const favoriteSet = new Set(
      (favorites || []).map(f => `${f.category_id}:${f.word_chinese}`)
    )

    return NextResponse.json({ 
      success: true, 
      favorites: favorites || [],
      favoriteSet: Array.from(favoriteSet)
    })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({ 
      error: error.message || 'エラーが発生しました' 
    }, { status: 500 })
  }
}

