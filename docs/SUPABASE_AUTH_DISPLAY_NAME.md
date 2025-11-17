# Supabase認証の表示名を変更する方法

## 問題
Googleログイン時に「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示が表示され、ユーザーに不安を与える可能性があります。

## 解決方法

**重要：** 表示名を変更するには、**Supabaseダッシュボードでの設定が最も簡単で確実な方法**です。Google Cloud Consoleは、Supabaseが独自のOAuthアプリケーションを使用している場合のみ関係します。

### 方法1: Supabaseダッシュボードでサイト名を変更（推奨・最も簡単）

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **認証設定を開く**
   - 左側メニューから「Authentication」をクリック
   - 「URL Configuration」または「Settings」を開く

3. **サイト名を変更**
   - 「Site URL」または「Site Name」の設定を確認
   - 可能であれば、カスタムドメインを設定
   - または、サイト名を「カントン語音れん」に変更

4. **リダイレクトURLを確認**
   - 「Redirect URLs」に正しいURLが設定されているか確認
   - `https://slang-cantonese-app.vercel.app/auth/callback` が含まれているか確認

### 方法2: カスタムドメインを使用（最適解）

Supabaseの認証をカスタムドメインで提供する場合：

1. **Supabaseダッシュボードでカスタムドメインを設定**
   - 「Authentication」→「URL Configuration」
   - カスタムドメインを設定（例: `auth.slang-cantonese-app.vercel.app`）

2. **環境変数を更新**
   - `NEXT_PUBLIC_SUPABASE_URL` をカスタムドメインに変更

### 方法3: Google Cloud Consoleでアプリ名を変更（Supabaseが独自のOAuthアプリを使用している場合のみ）

**注意：** この方法は、Supabaseが独自のGoogle Cloud Consoleプロジェクトを使用している場合のみ有効です。SupabaseがデフォルトのOAuthアプリを使用している場合は、この方法では変更できません。

**確認方法：**
1. Supabaseダッシュボード → 「Authentication」→「Providers」→「Google」
2. 「Client ID」と「Client Secret」が設定されているか確認
3. 設定されている場合のみ、以下の手順を実行

**手順：**
1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/
   - Supabaseで使用しているプロジェクトを選択（通常はSupabaseが自動的に作成）

2. **OAuth同意画面を編集**
   - 「APIとサービス」→「OAuth同意画面」
   - 「アプリ名」を「カントン語音れん」に変更
   - 「保存」をクリック

3. **SupabaseのGoogle OAuth設定を確認**
   - Supabaseダッシュボード → 「Authentication」→「Providers」→「Google」
   - Google Cloud Consoleの設定と一致しているか確認

## 注意事項

- Google OAuthの設定変更は、Googleの承認プロセスが必要な場合があります
- カスタムドメインの設定には追加の設定が必要な場合があります
- 変更後は、認証フローが正常に動作するか確認してください

## 現在の設定確認

現在のSupabase URL:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://qdmvituurfevyibtzwsb.supabase.co`

このURLはSupabaseが自動生成したプロジェクト固有のURLです。表示名を変更するには、上記の方法を試してください。

