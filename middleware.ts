import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ログインページ、認証関連ページ、APIルートは認証不要
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/contact') ||
      request.nextUrl.pathname.startsWith('/api/translate') ||
      request.nextUrl.pathname.startsWith('/_next')) {
    return supabaseResponse
  }

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 管理者ページのアクセス制御（サーバーサイドでチェック）
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminEmails = ['bestinksalesman@gmail.com'];
    const isAdmin = adminEmails.includes(user.email || '') || 
                    user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      // 管理者でない場合はトップページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
