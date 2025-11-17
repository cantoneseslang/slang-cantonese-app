# 「qdmvituurfevyibtzwsb.supabase.co/」表示を変更する方法

## 問題の本質

Googleログイン時に表示される「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示は、**Google OAuthの認証フローで表示されるSupabaseの認証エンドポイントURLそのもの**です。

この表示を完全に変更するのは**技術的に困難**ですが、以下の方法で改善できます。

## 解決方法

### 方法1: Supabaseのカスタムドメインを使用（最も効果的）

**注意**: この方法には**Supabase Proプラン以上が必要**です。

1. **Supabaseダッシュボードでカスタムドメインを設定**
   - 「Authentication」→「URL Configuration」
   - 「Custom Domain」セクションを確認
   - カスタムドメインを設定（例: `auth.slang-cantonese-app.vercel.app`）

2. **環境変数を更新**
   - Vercelの環境変数で `NEXT_PUBLIC_SUPABASE_URL` をカスタムドメインに変更
   - 例: `https://auth.slang-cantonese-app.vercel.app`

3. **効果**
   - 認証エンドポイントのURLがカスタムドメインに変更される
   - Googleログイン画面で「auth.slang-cantonese-app.vercel.app」と表示される

### 方法2: Google OAuthのアプリ名を変更（部分的に効果的）

**注意**: この方法は、Supabaseが独自のGoogle OAuthアプリを使用している場合のみ有効です。

1. **Supabaseダッシュボードで確認**
   - 「Authentication」→「Providers」→「Google」
   - 「Client ID」と「Client Secret」が設定されているか確認

2. **Google Cloud Consoleでアプリ名を変更**
   - https://console.cloud.google.com/
   - 「APIとサービス」→「OAuth同意画面」
   - 「アプリ名」を「カントン語音れん」に変更
   - 「保存」をクリック

3. **効果**
   - Googleログイン画面の上部に「カントン語音れん」と表示される
   - ただし、「qdmvituurfevyibtzwsb.supabase.co/」に移動という表示は残る

### 方法3: 認証フローを変更（高度）

Supabaseの認証を直接使用せず、独自の認証フローを実装する方法もありますが、これは**大幅な変更が必要**で、推奨されません。

## 現実的な解決策

### 推奨: ユーザーへの説明を追加

完全に表示を変更できない場合、ユーザーに説明を追加することで、不安を軽減できます：

1. **ログインページに説明を追加**
   - 「Googleアカウントで安全にログインします」
   - 「認証はSupabase（セキュアな認証サービス）を通じて行われます」

2. **ローディング画面で説明**
   - 「認証処理中...」
   - 「Googleアカウントでログインしています」

## 現在の状況

- **Supabase URL**: `https://qdmvituurfevyibtzwsb.supabase.co`
- **このURLは変更できません**（Supabaseが自動生成したプロジェクト固有のURL）

## 結論

**完全に表示を変更するには、Supabase Proプラン以上でカスタムドメインを使用する必要があります。**

無料プランの場合：
- Google OAuthのアプリ名を変更することで、部分的に改善できます
- ユーザーへの説明を追加することで、不安を軽減できます

## 次のステップ

1. **Supabaseダッシュボードで確認**
   - 「Authentication」→「Providers」→「Google」
   - 「Client ID」と「Client Secret」が設定されているか確認

2. **設定されている場合**
   - Google Cloud Consoleでアプリ名を「カントン語音れん」に変更

3. **設定されていない場合**
   - Supabase Proプラン以上でカスタムドメインを設定
   - または、ユーザーへの説明を追加

