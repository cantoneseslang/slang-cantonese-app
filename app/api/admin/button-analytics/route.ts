import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 })

  const adminEmails = ['bestinksalesman@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin === true
  if (!isAdmin) return NextResponse.json({ success: false, error: '管理者権限が必要です' }, { status: 403 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ success: false, error: 'Supabase設定不足' }, { status: 500 })

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // 全イベント取得（ユニークボタン集合も算出）
  const { data: events, error: evErr } = await admin
    .from('user_button_events')
    .select('user_id, button_key, category_id')

  if (evErr) return NextResponse.json({ success: false, error: evErr.message }, { status: 500 })

  const allButtons = new Set<string>()
  const perUser = new Map<string, Set<string>>()

  (events || []).forEach((e: any) => {
    allButtons.add(e.button_key)
    if (!perUser.has(e.user_id)) perUser.set(e.user_id, new Set<string>())
    perUser.get(e.user_id)!.add(e.button_key)
  })

  const totalButtons = allButtons.size

  // ユーザー情報
  const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers()
  if (usersErr) return NextResponse.json({ success: false, error: usersErr.message }, { status: 500 })

  const rows = (users || []).map(u => {
    const pressed = perUser.get(u.id)?.size || 0
    const notPressed = Math.max(totalButtons - pressed, 0)
    return {
      user_id: u.id,
      email: u.email,
      pressed,
      not_pressed: notPressed,
    }
  })

  return NextResponse.json({ success: true, total_buttons: totalButtons, users: rows })
}


