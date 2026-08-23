import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const survey = requestUrl.searchParams.get('survey')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const redirectUrl = new URL(requestUrl.origin)
  if (survey === 'true') {
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('survey', '1')
  }

  return NextResponse.redirect(redirectUrl)
}
