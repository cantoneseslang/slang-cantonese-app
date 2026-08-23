import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function oauthErrorMessage(error: string, description: string): string {
  const text = `${error} ${description}`.toLowerCase();
  if (
    text.includes('already') ||
    text.includes('registered') ||
    text.includes('exists') ||
    text.includes('identity')
  ) {
    return 'このGmailはすでに登録されています。Googleでログインするか、登録時の方法で入ってください。';
  }
  return 'Googleログインに失敗しました。もう一度お試しください。';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const survey = requestUrl.searchParams.get('survey')
  const oauthError = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description') || ''

  const homeUrl = new URL('/', requestUrl.origin)
  const loginUrl = new URL('/login', requestUrl.origin)

  if (oauthError) {
    loginUrl.searchParams.set('message', oauthErrorMessage(oauthError, errorDescription))
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      loginUrl.searchParams.set('message', 'Googleログインに失敗しました。もう一度お試しください。')
      return NextResponse.redirect(loginUrl)
    }

    const user = data.user
    if (user?.user_metadata?.survey_completed === true) {
      return NextResponse.redirect(homeUrl)
    }
    if (user) {
      loginUrl.searchParams.set('survey', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  if (survey === 'true') {
    loginUrl.searchParams.set('survey', '1')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(homeUrl)
}
