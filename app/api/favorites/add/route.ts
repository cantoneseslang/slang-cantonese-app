import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { wordChinese, wordJapanese, categoryId } = await request.json()
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 会員種別を取得
    const membershipType = user.user_metadata?.membership_type || 'free'
    
    // 現在のお気に入り数を取得
    const { data: existingFavorites, error: countError } = await supabase
      .from('user_favorites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    
    if (countError) {
      console.error('お気に入り数取得エラー:', countError)
      // テーブルが存在しない場合は空配列として処理し、エラーを返さない
      if (countError.code === 'PGRST116' || countError.message?.includes('relation') || countError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'お気に入り機能を使用するには、Supabaseでテーブルを作成する必要があります。',
          details: 'docs/favorites-table.sqlのSQLをSupabaseのSQL Editorで実行してください。'
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'お気に入りの取得に失敗しました。',
        details: countError.message
      }, { status: 500 })
    }

    const favoriteCount = existingFavorites?.length || 0
    
    // ブロンズ会員は6個まで
    if (membershipType === 'free' && favoriteCount >= 6) {
      return NextResponse.json({ 
        error: 'ブロンズ会員はお気に入りを6個までしか保存できません。',
        limit: 6,
        current: favoriteCount
      }, { status: 403 })
    }

    // 既に存在するかチェック
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('word_chinese', wordChinese)
      .eq('category_id', categoryId)
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: '既にお気に入りに登録されています' 
      }, { status: 400 })
    }

    // お気に入りを追加
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        word_chinese: wordChinese,
        word_japanese: wordJapanese,
        category_id: categoryId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('お気に入り追加エラー:', error)
      return NextResponse.json({ 
        error: error.message || 'お気に入りの追加に失敗しました' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({ 
      error: error.message || 'エラーが発生しました' 
    }, { status: 500 })
  }
}

