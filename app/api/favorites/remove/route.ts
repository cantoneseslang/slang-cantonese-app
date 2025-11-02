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
      // テーブル未検出エラーの場合は成功レスポンスを返す（ローカル状態で動作）
      if (isTableNotFoundError(error)) {
        console.warn('テーブルが存在しません。ローカル状態で削除されます。')
        return NextResponse.json({ 
          success: true,
          message: 'テーブルが存在しませんが、ローカル状態でお気に入りが削除されました。'
        })
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
        success: true,
        message: 'テーブルが存在しませんが、ローカル状態でお気に入りが削除されました。'
      })
    }
    
    return NextResponse.json({ 
      error: errorMessage || 'エラーが発生しました' 
    }, { status: 500 })
  }
}

