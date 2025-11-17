# Supabase URL Configuration 設定ガイド

## 現在の設定確認

Supabaseダッシュボードの「URL Configuration」ページで以下を確認してください：

### Site URL
- **現在の値**: `https://slang-cantonese`（途中で切れている可能性）
- **推奨値**: `https://slang-cantonese-app.vercel.app`
- **説明**: 認証時のデフォルトリダイレクトURLとして使用されます

### Redirect URLs
以下のURLが登録されていることを確認：
- ✅ `https://slang-cantonese-app.vercel.app/auth/callback`（本番環境）
- ✅ `http://localhost:3000/auth/callback`（ローカル開発環境）

## 設定手順

### 1. Site URLを完全なURLに設定

1. **「Site URL」セクションの入力フィールドをクリック**
2. **完全なURLを入力**:
   ```
   https://slang-cantonese-app.vercel.app
   ```
3. **「Save changes」ボタンをクリック**

### 2. Redirect URLsの確認

既に正しいURLが登録されているか確認：
- `https://slang-cantonese-app.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

必要に応じて「Add URL」ボタンで追加してください。

## 注意事項

### Googleログイン画面の表示について

**重要**: 「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示は、Supabaseの認証エンドポイントのURLそのものです。これは**変更できません**。

**理由**:
- Supabaseの認証は、`qdmvituurfevyibtzwsb.supabase.co` というSupabaseが自動生成したプロジェクト固有のURLで行われます
- このURLは、Supabaseプロジェクトの識別子として機能します
- Google OAuthの認証フローでは、このSupabaseのURLが表示されます

### 表示名を変更する方法

完全に表示名を変更するには、以下の方法があります：

1. **カスタムドメインを使用**（Supabase Proプラン以上が必要）
   - Supabaseでカスタムドメインを設定
   - 認証エンドポイントをカスタムドメインに変更

2. **Google OAuthの設定を変更**（Supabaseが独自のOAuthアプリを使用している場合）
   - Google Cloud ConsoleでOAuth同意画面のアプリ名を変更
   - ただし、URLの表示は変更できません

## 推奨事項

現在の設定で問題なく動作する場合は、**そのまま使用することを推奨**します。

「qdmvituurfevyibtzwsb.supabase.co/」という表示は、Supabaseの標準的な動作であり、セキュリティ上の問題はありません。ユーザーはGoogleアカウントでログインするだけなので、このURLが表示されても問題ありません。

