import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// テーブルが存在しないエラーかどうかを判定する関数
function isTableNotFoundError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || ''
  const errorCode = error.code || ''
  
  // テーブル未検出エラーのパターンを網羅的にチェック
  const tableNotFoundPatterns = [
    'PGRST116', // Supabaseのテーブル未検出エラーコード
    'relation',
    'does not exist',
    'no such table',
    'Could not find the table',
    'schema cache',
    'user_favorites',
    'Table',
    'table',
    'not found',
    'NotFound'
  ]
  
  return tableNotFoundPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  )
}

export async function POST(request: Request) {
  try {
    const { wordChinese, wordJapanese, categoryId } = await request.json()
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // テーブル存在確認を最初に行う（軽量なクエリで確認）
    const { error: tableCheckError } = await supabase
      .from('user_favorites')
      .select('id')
      .limit(0)
    
    // テーブルが存在しない場合はエラーを返す（データ永続化のため）
    if (tableCheckError && isTableNotFoundError(tableCheckError)) {
      console.error('テーブルが存在しません。データを永続化するにはテーブル作成が必要です。')
      return NextResponse.json({ 
        success: false,
        error: 'お気に入りテーブルが存在しません',
        message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
        details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
        requiresTable: true
      }, { status: 503 }) // Service Unavailable
    }
    
    // テーブルが存在する場合のみ、通常の処理を実行
    const membershipType = user.user_metadata?.membership_type || 'free'
    
    // 現在のお気に入り数を取得
    const { data: existingFavorites, error: countError } = await supabase
      .from('user_favorites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    
    // エラーが発生した場合はテーブル未検出の可能性を再チェック
    if (countError) {
      if (isTableNotFoundError(countError)) {
        return NextResponse.json({ 
          success: false,
          error: 'お気に入りテーブルが存在しません',
          message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
          details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
          requiresTable: true
        }, { status: 503 })
      }
      // その他のエラーは500を返す
      console.error('お気に入り数取得エラー:', countError)
      return NextResponse.json({ 
        error: 'お気に入りの取得に失敗しました',
        details: countError.message
      }, { status: 500 })
    }

    const favoriteCount = (existingFavorites && Array.isArray(existingFavorites)) ? existingFavorites.length : 0
    
    // ブロンズ会員は6個まで
    if (membershipType === 'free' && favoriteCount >= 6) {
      return NextResponse.json({ 
        error: 'ブロンズ会員はお気に入りを6個までしか保存できません。',
        limit: 6,
        current: favoriteCount
      }, { status: 403 })
    }

    // 既に存在するかチェック
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('word_chinese', wordChinese)
      .eq('category_id', categoryId)
      .maybeSingle() // single()の代わりにmaybeSingle()を使用（レコードが存在しない場合はnullを返す）

    if (checkError) {
      if (isTableNotFoundError(checkError)) {
        return NextResponse.json({ 
          success: false,
          error: 'お気に入りテーブルが存在しません',
          message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
          details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
          requiresTable: true
        }, { status: 503 })
      }
      // その他のエラーは警告ログに記録して処理を続行
      console.warn('お気に入り存在チェックエラー（処理続行）:', checkError.message)
    }

    if (existing) {
      return NextResponse.json({ 
        error: '既にお気に入りに登録されています' 
      }, { status: 400 })
    }

    // お気に入りを追加
    const { data, error: insertError } = await supabase
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

    if (insertError) {
      // テーブル未検出エラーの場合はエラーを返す
      if (isTableNotFoundError(insertError)) {
        return NextResponse.json({ 
          success: false,
          error: 'お気に入りテーブルが存在しません',
          message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
          details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
          requiresTable: true
        }, { status: 503 })
      }
      
      console.error('お気に入り追加エラー:', insertError)
      return NextResponse.json({ 
        error: insertError.message || 'お気に入りの追加に失敗しました' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('APIエラー:', error)
    
    // キャッチされたエラーもテーブル未検出の可能性をチェック
    const errorMessage = error?.message || String(error)
    if (isTableNotFoundError({ message: errorMessage })) {
      return NextResponse.json({ 
        success: false,
        error: 'お気に入りテーブルが存在しません',
        message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
        details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
        requiresTable: true
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: errorMessage || 'エラーが発生しました' 
    }, { status: 500 })
  }
}

