import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { wordChinese, categoryId } = await req.json()
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 })
    }

    // 記録テーブル: user_button_events(user_id, button_key, category_id, created_at)
    const buttonKey = `${categoryId || ''}:${wordChinese}`
    const { error: insertError } = await supabase
      .from('user_button_events')
      .insert({
        user_id: user.id,
        button_key: buttonKey,
        category_id: categoryId || null
      })

    if (insertError) {
      // テーブルがない場合は無視して成功扱い（運用を止めない）
      return NextResponse.json({ success: true, note: 'no_table_or_insert_error', details: insertError.message })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 })
  }
}



