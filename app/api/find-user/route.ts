import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    const supabase = createClient()

    // ユーザーネームテーブルから検索
    const { data, error } = await supabase
      .from('user_usernames')
      .select('email')
      .eq('username', username)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ email: data.email })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'エラーが発生しました' }, { status: 500 })
  }
}
