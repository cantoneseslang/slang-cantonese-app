import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 管理者がテーブル作成SQLを取得するAPI
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '認証が必要です'
      }, { status: 401 })
    }

    // 管理者チェック
    const adminEmails = ['bestinksalesman@gmail.com']
    const isAdmin = 
      adminEmails.includes(user.email || '') ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: '管理者権限が必要です'
      }, { status: 403 })
    }

    // SQLを返す
    const sql = `CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_chinese TEXT NOT NULL,
  word_japanese TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_chinese, category_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_category_id ON user_favorites(category_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view their own favorites"
  ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);`

    return NextResponse.json({
      success: true,
      sql: sql
    })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      details: error.message
    }, { status: 500 })
  }
}

// 管理者がテーブル作成を試行するAPI（PostgreSQL直接接続はできないため、SQLを返す）
export async function POST() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '認証が必要です'
      }, { status: 401 })
    }

    // 管理者チェック
    const adminEmails = ['bestinksalesman@gmail.com']
    const isAdmin = 
      adminEmails.includes(user.email || '') ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: '管理者権限が必要です'
      }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase設定が不完全です'
      }, { status: 500 })
    }

    // サービスロールキーでSupabaseクライアントを作成
    const adminSupabase = createAdminClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // テーブルが既に存在するかチェック
    const { data: checkData, error: checkError } = await adminSupabase
      .from('user_favorites')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'テーブルは既に存在しています'
      })
    }

    // テーブル未検出エラーの場合
    if (checkError && (checkError.code === 'PGRST116' || checkError.message?.includes('Could not find the table') || checkError.message?.includes('schema cache'))) {
      // Supabaseの管理APIには直接SQL実行機能がないため、SQLを返す
      const sql = `CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_chinese TEXT NOT NULL,
  word_japanese TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_chinese, category_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_category_id ON user_favorites(category_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view their own favorites"
  ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);`

      return NextResponse.json({
        success: false,
        requiresManualCreation: true,
        message: 'Supabaseの管理APIには直接SQL実行機能がないため、手動でテーブルを作成する必要があります',
        sql: sql,
        instructions: [
          '1. Supabaseダッシュボードにログイン',
          '2. SQL Editorを開く',
          '3. 上記のSQLをコピー＆ペースト',
          '4. Runを実行'
        ]
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: 'テーブル状態を確認できませんでした',
      details: checkError.message
    }, { status: 500 })
  } catch (error: any) {
    console.error('APIエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      details: error.message
    }, { status: 500 })
  }
}

