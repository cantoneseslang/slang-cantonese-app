#!/usr/bin/env node

/**
 * Supabaseユーザーデータ確認スクリプト
 * 環境変数から直接Supabaseに接続してユーザー情報を確認
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserData(email) {
  console.log('\n🔍 Supabaseユーザーデータ確認中...\n');
  console.log('検索対象:', email);
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Admin APIは使えないので、認証されたユーザーで確認する必要がある
    // 代わりに、認証が必要なエンドポイントを確認
    console.log('⚠️  Anon Keyではユーザー情報に直接アクセスできません');
    console.log('   アプリケーション内の認証セッションを使用する必要があります\n');
    
    console.log('✅ 確認方法:');
    console.log('   1. アプリケーションを開く');
    console.log('   2. ログインする');
    console.log('   3. ブラウザのコンソールで以下を実行:');
    console.log('');
    console.log('   const { createClient } = await import("@supabase/ssr");');
    console.log('   const supabase = createClient(');
    console.log('     process.env.NEXT_PUBLIC_SUPABASE_URL,');
    console.log('     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   );');
    console.log('   const { data: { user } } = await supabase.auth.getUser();');
    console.log('   console.log("User:", user);');
    console.log('   console.log("Username:", user?.user_metadata?.username);');
    console.log('   console.log("Membership:", user?.user_metadata?.membership_type);');
    console.log('');
    
    // ただし、Supabaseの管理APIを使えば確認できる
    // サービスロールキーが必要だが、それがない場合はできない
    
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2] || 'bestinksalesman@gmail.com';
checkUserData(email);

