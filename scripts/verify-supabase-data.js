#!/usr/bin/env node

/**
 * Supabaseデータ検証スクリプト
 * ブラウザのコンソールで実行するためのコード生成
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Supabaseデータ検証コード                                ║
╚═══════════════════════════════════════════════════════════╝

以下のコードをブラウザの開発者ツール（F12）のコンソールで実行してください：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(async () => {
  // Supabaseクライアントの作成（環境変数から取得）
  const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL || '環境変数未設定'}';
  const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***設定済み***' : '環境変数未設定'}';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? '設定済み' : '未設定');
  
  // ブラウザのlocalStorageからセッション情報を取得
  const sessionData = localStorage.getItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
  
  if (!sessionData) {
    console.error('❌ セッションが見つかりません。ログインしてください。');
    return;
  }
  
  console.log('✅ セッションが見つかりました');
  
  // 実際の確認はアプリケーション内のコンソールで行ってください
  console.log('💡 アプリケーション内（設定画面）で以下を確認：');
  console.log('   1. ブラウザの開発者ツール（F12）を開く');
  console.log('   2. コンソールタブで「現在のユーザー情報（Supabase）」のログを確認');
  console.log('   3. Networkタブで「updateUser」APIのレスポンスを確認');
})();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 より詳細な確認方法：

1. アプリケーション（http://localhost:3000）を開く
2. 設定画面を開く
3. ブラウザの開発者ツール（F12）を開く
4. Consoleタブで「現在のユーザー情報（Supabase）」のログを確認
5. Networkタブで「updateUser」APIリクエストのレスポンスを確認
   - ステータス: 200 OK
   - レスポンスボディに user.user_metadata が含まれているか確認

`);

