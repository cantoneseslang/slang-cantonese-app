# Supabase認証設定ガイド

このアプリケーションはSupabaseを使用した認証機能を実装しています。

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成（またはログイン）
2. 新しいプロジェクトを作成
3. プロジェクトのSettings > APIから以下を取得：
   - Project URL
   - anon/public key

### 2. 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Google OAuth設定（オプション）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存プロジェクトを選択）
3. OAuth同意画面を設定
4. 認証情報 > OAuth 2.0 クライアントIDを作成
5. 承認済みのリダイレクト URIに以下を追加：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   （`your-project-ref`はSupabaseプロジェクトの参照ID）
6. Supabaseダッシュボードで：
   - Authentication > Providers > Google
   - Google OAuthを有効化
   - Client IDとClient Secretを設定

### 4. Vercel環境変数の設定

Vercelにデプロイする場合、以下の環境変数を設定：

1. Vercelダッシュボード > Project Settings > Environment Variables
2. 以下を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. 認証フロー

- **メール/パスワード認証**: ログインページから直接登録・ログイン可能
- **Google OAuth**: Googleアカウントでログイン可能
- **認証必須**: すべてのページ（`/login`を除く）にアクセスするにはログインが必要

### 6. 確認

1. アプリを起動：`npm run dev`
2. 未ログイン状態でアクセスすると`/login`にリダイレクトされることを確認
3. ログイン後、メインページにアクセスできることを確認
4. ヘッダーのログアウトボタンでログアウトできることを確認
