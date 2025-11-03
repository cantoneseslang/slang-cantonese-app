import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, username, email } = await request.json()
    const supabase = await createClient()

    // ユーザーネームテーブルに保存
    const { error } = await supabase
      .from('user_usernames')
      .upsert({
        user_id: userId,
        username: username,
        email: email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'エラーが発生しました' }, { status: 500 })
  }
}



