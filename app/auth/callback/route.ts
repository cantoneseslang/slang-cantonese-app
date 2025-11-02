import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const survey = requestUrl.searchParams.get('survey')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Google認証で新規登録の場合、アンケートが未完了ならアンケートページにリダイレクト
    if (survey === 'true') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !user.user_metadata?.survey_completed) {
        return NextResponse.redirect(`${requestUrl.origin}/survey`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
