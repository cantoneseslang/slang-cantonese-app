import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 注意: このエンドポイントは管理者のみがアクセスできるようにするべきです
// 現在はデバッグ目的でのみ使用

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: '環境変数が設定されていません'
      }, { status: 500 });
    }

    // 注意: Anon Keyではauth.usersテーブルに直接アクセスできません
    // このエンドポイントは実際のユーザー情報を取得するには制限があります
    // 実際のユーザー情報を取得するには、サービスロールキーが必要です
    
    return NextResponse.json({
      message: 'ユーザー情報の取得にはSupabaseダッシュボードへのアクセスが必要です',
      supabase_url: supabaseUrl,
      instructions: [
        '1. Supabaseダッシュボードにアクセス: https://supabase.com/dashboard',
        '2. プロジェクト「qdmvituurfevyibtzwsb」を選択',
        '3. Authentication > Users を選択',
        '4. 登録されているユーザーの一覧を確認'
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'エラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
}



