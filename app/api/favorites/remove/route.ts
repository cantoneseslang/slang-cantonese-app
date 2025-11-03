import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// テーブルが存在しないエラーかどうかを判定する関数
function isTableNotFoundError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || ''
  const errorCode = error.code || ''
  
  // テーブル未検出エラーのパターンを網羅的にチェック
  const tableNotFoundPatterns = [
    'PGRST116',
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
      // テーブル未検出エラーの場合はエラーを返す（データ永続化のため）
      if (isTableNotFoundError(error)) {
        console.error('テーブルが存在しません。データを永続化するにはテーブル作成が必要です。')
        return NextResponse.json({ 
          success: false,
          error: 'お気に入りテーブルが存在しません',
          message: 'データを永続的に保存するには、Supabaseでテーブルを作成する必要があります。',
          details: 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。',
          requiresTable: true
        }, { status: 503 })
      }
      
      console.error('お気に入り削除エラー:', error)
      return NextResponse.json({ 
        error: error.message || 'お気に入りの削除に失敗しました' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
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

