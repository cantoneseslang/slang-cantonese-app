# Supabase Proプランでカスタムドメインを設定する方法

## 目標
「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示を、カスタムドメイン（例: `auth.slang-cantonese-app.vercel.app`）に変更します。

## 前提条件
- ✅ Supabase Proプラン以上
- ✅ Vercelでドメインを管理できる

## 設定手順

### ステップ1: Vercelでサブドメインを設定

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard
   - プロジェクト「slang-cantonese-app」を選択

2. **ドメイン設定を開く**
   - 「Settings」→「Domains」
   - 「Add Domain」をクリック

3. **サブドメインを追加**
   - ドメイン名: `auth.slang-cantonese-app.vercel.app`
   - または、独自ドメインがある場合: `auth.yourdomain.com`
   - 「Add」をクリック

4. **DNS設定を確認**
   - Vercelが自動的にDNS設定を管理します
   - 設定が反映されるまで数分かかる場合があります

### ステップ2: Supabaseでカスタムドメインを設定

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **認証設定を開く**
   - 左側メニューから「Authentication」をクリック
   - 「URL Configuration」を開く

3. **カスタムドメインを設定**
   - 「Custom Domain」セクションを確認
   - カスタムドメインを入力:
     - `auth.slang-cantonese-app.vercel.app`
     - または、独自ドメイン: `auth.yourdomain.com`
   - 「Save」をクリック

4. **DNS設定を確認**
   - Supabaseが提供するDNS設定（CNAMEレコードなど）を確認
   - VercelのDNS設定と整合性を確認

### ステップ3: 環境変数を更新

1. **Vercelの環境変数を更新**
   - Vercelダッシュボード → 「Settings」→「Environment Variables」
   - `NEXT_PUBLIC_SUPABASE_URL` を更新:
     - 旧: `https://qdmvituurfevyibtzwsb.supabase.co`
     - 新: `https://auth.slang-cantonese-app.vercel.app`

2. **ローカル開発環境も更新**（オプション）
   - `.env.local` ファイルを更新
   - ただし、ローカル開発では元のURLを使用することも可能

3. **再デプロイ**
   - 環境変数を更新した後、Vercelが自動的に再デプロイします
   - または、手動で再デプロイを実行

### ステップ4: 動作確認

1. **認証フローをテスト**
   - ログインページにアクセス
   - Googleログインを試す
   - Googleログイン画面で、カスタムドメインが表示されるか確認

2. **リダイレクトURLを確認**
   - Supabaseダッシュボード → 「Authentication」→「URL Configuration」
   - 「Redirect URLs」に以下が含まれているか確認:
     - `https://slang-cantonese-app.vercel.app/auth/callback`

## 注意事項

### DNS設定の反映時間
- DNS設定の変更が反映されるまで、数分から数時間かかる場合があります
- 設定後、しばらく待ってからテストしてください

### 証明書の設定
- Supabaseが自動的にSSL証明書を設定します
- 証明書の設定が完了するまで、数分かかる場合があります

### 既存のユーザーへの影響
- カスタムドメインに変更しても、既存のユーザーには影響しません
- 認証フローは正常に動作します

## トラブルシューティング

### カスタムドメインが表示されない場合

1. **DNS設定を確認**
   - VercelのDNS設定が正しいか確認
   - SupabaseのDNS設定と整合性を確認

2. **証明書の設定を確認**
   - Supabaseダッシュボードで証明書の状態を確認
   - 証明書が有効になるまで待つ

3. **環境変数を確認**
   - `NEXT_PUBLIC_SUPABASE_URL` が正しく設定されているか確認
   - Vercelで再デプロイが完了しているか確認

## 参考リンク

- [Supabase Custom Domain Documentation](https://supabase.com/docs/guides/platform/custom-domains)
- [Vercel Domain Configuration](https://vercel.com/docs/concepts/projects/domains)

