import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({
        error: 'ユーザー取得エラー',
        details: userError.message
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({
        error: 'ログインしていません'
      }, { status: 401 });
    }
    
    // セッション情報も取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || null,
        membership_type: user.user_metadata?.membership_type || null,
        has_password: !!user.identities?.find(i => i.provider === 'email'),
        last_sign_in_at: user.last_sign_in_at,
        updated_at: user.updated_at,
        created_at: user.created_at,
        full_metadata: user.user_metadata,
        identities: user.identities,
        has_session: !!session
      },
      session: session ? {
        expires_at: session.expires_at,
        token_type: session.token_type
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'エラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
}

