import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { wordChinese, categoryId } = await request.json()
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // お気に入りを削除
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('word_chinese', wordChinese)
      .eq('category_id', categoryId)

    if (error) {
      console.error('お気に入り削除エラー:', error)
      return NextResponse.json({ 
        error: error.message || 'お気に入りの削除に失敗しました' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({ 
      error: error.message || 'エラーが発生しました' 
    }, { status: 500 })
  }
}

