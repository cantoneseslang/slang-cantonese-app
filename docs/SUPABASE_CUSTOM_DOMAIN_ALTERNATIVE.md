# Supabaseカスタムドメインが見つからない場合の対処法

## 問題
Supabaseダッシュボードで「Custom Domain」セクションが見つからない場合の対処法です。

## 確認事項

### 1. カスタムドメイン機能の利用可能性

カスタムドメイン機能は、以下の条件で利用可能です：
- ✅ Supabase Proプラン以上
- ✅ 一部のリージョンでのみ利用可能
- ✅ プロジェクトの作成時期によっては利用できない場合がある

### 2. カスタムドメイン設定の場所

カスタムドメイン設定は、以下の場所にある可能性があります：

#### 方法1: Settings → General
1. Supabaseダッシュボード → プロジェクトを選択
2. 左側メニューから「Settings」→「General」を開く
3. 「Custom Domain」セクションを確認

#### 方法2: Project Settings
1. Supabaseダッシュボード → プロジェクトを選択
2. 左側メニューから「Settings」→「Project Settings」を開く
3. 「Custom Domain」セクションを確認

#### 方法3: Authentication → URL Configuration
1. Supabaseダッシュボード → プロジェクトを選択
2. 左側メニューから「Authentication」→「URL Configuration」を開く
3. 「Custom Domain」セクションを確認（通常はここにはない）

## カスタムドメインが利用できない場合の代替案

### 代替案1: Google OAuthのアプリ名を変更（推奨）

Google OAuthの認証画面で表示されるアプリ名を変更することで、ユーザー体験を改善できます。

#### 設定手順

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com
   - プロジェクトを選択

2. **OAuth同意画面を開く**
   - 「APIとサービス」→「OAuth同意画面」
   - 「ブランディング」タブを選択

3. **アプリ名を変更**
   - 「アプリ名」を「カントン語音れん」に変更
   - 「保存」をクリック

4. **効果**
   - Googleログイン画面の上部に「カントン語音れん」と表示される
   - ただし、「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示は残る

### 代替案2: ログインページに説明を追加

ログインページに、認証フローについての説明を追加することで、ユーザーの不安を軽減できます。

#### 実装例

```tsx
// app/login/page.tsx に追加
<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-800">
    Googleログイン時に「qdmvituurfevyibtzwsb.supabase.co/」に移動と表示されますが、
    これは安全な認証プロセスの一部です。心配ありません。
  </p>
</div>
```

### 代替案3: Supabaseサポートに問い合わせ

カスタムドメイン機能が利用できない場合、Supabaseサポートに問い合わせて確認してください。

1. **Supabaseダッシュボード**
   - 「Help」→「Support」を開く
   - または、https://supabase.com/support にアクセス

2. **問い合わせ内容**
   - 「Custom Domain機能を利用したいが、設定画面が見つからない」
   - プロジェクトID: `qdmvituurfevyibtzwsb`
   - プラン: Pro

## 現実的な解決策

**現時点で最も現実的な解決策は、Google OAuthのアプリ名を変更することです。**

これにより：
- ✅ Googleログイン画面の上部に「カントン語音れん」と表示される
- ✅ ユーザーがアプリを識別しやすくなる
- ✅ 設定が簡単で、すぐに反映される

「qdmvituurfevyibtzwsb.supabase.co/」というURL表示は、Supabaseの認証エンドポイントそのものなので、完全に削除することはできませんが、アプリ名を変更することで、ユーザー体験は大幅に改善されます。

## 参考リンク

- [Supabase Custom Domain Documentation](https://supabase.com/docs/guides/platform/custom-domains)
- [Google OAuth Branding Settings](https://console.cloud.google.com/apis/credentials/consent)

