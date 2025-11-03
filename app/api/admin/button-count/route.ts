import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getButtonCountsSummary } from '@/lib/analytics/buttonCounts'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 })

  const adminEmails = ['bestinksalesman@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin === true
  if (!isAdmin) return NextResponse.json({ success: false, error: '管理者権限が必要です' }, { status: 403 })

  try {
    const summary = getButtonCountsSummary()
    return NextResponse.json({ success: true, ...summary })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}


