# Google OAuthアプリ名が変更されない場合のトラブルシューティング

## 問題
Google Cloud ConsoleのOAuth同意画面でアプリ名を変更したが、Googleログイン画面で何も変わらない。

## 原因の確認

### ステップ1: SupabaseがどのGoogle OAuthアプリを使用しているか確認

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **認証プロバイダー設定を確認**
   - 「Authentication」→「Providers」→「Google」を開く
   - 「Client ID」と「Client Secret」が設定されているか確認

### ケースA: Client IDとClient Secretが設定されている場合

**これは、Supabaseが独自のGoogle OAuthアプリを使用していることを意味します。**

この場合、Google Cloud Consoleでの変更が有効になるはずです。以下を確認してください：

#### 確認事項1: 正しいプロジェクトを変更したか

1. **SupabaseのClient IDを確認**
   - Supabaseダッシュボード → 「Authentication」→「Providers」→「Google」
   - 「Client ID」をコピー（例: `451113233741-03n96mci19beecb9gtua4ufgopl9...`）

2. **Google Cloud Consoleでプロジェクトを確認**
   - Google Cloud Console → プロジェクト選択
   - 「APIとサービス」→「認証情報」
   - 「OAuth 2.0 クライアント ID」の一覧で、SupabaseのClient IDと一致するものを確認
   - 一致するプロジェクトでOAuth同意画面を変更する必要があります

#### 確認事項2: OAuth同意画面の設定を確認

1. **正しいタブで変更したか**
   - 「OAuth同意画面」→「ブランディング」タブで変更したか確認
   - 「ユーザータイプ」タブではなく、「ブランディング」タブです

2. **設定が保存されているか**
   - 「保存」ボタンをクリックしたか確認
   - 保存後、設定が正しく表示されているか確認

#### 確認事項3: 反映時間を待つ

- Google OAuthの設定変更は、反映されるまで数分から数時間かかる場合があります
- ブラウザのキャッシュをクリアしてから再度テストしてください

### ケースB: Client IDとClient Secretが設定されていない場合

**これは、SupabaseがデフォルトのOAuthアプリを使用していることを意味します。**

この場合、Google Cloud Consoleでの変更は**効果がありません**。SupabaseのデフォルトOAuthアプリを使用しているため、Google Cloud Consoleでの変更は反映されません。

#### 解決方法

1. **Supabaseで独自のGoogle OAuthアプリを設定する**
   - Google Cloud Consoleで新しいOAuth 2.0クライアントIDを作成
   - Supabaseダッシュボード → 「Authentication」→「Providers」→「Google」
   - 「Client ID」と「Client Secret」を設定
   - その後、Google Cloud ConsoleでOAuth同意画面の設定を変更

2. **または、Supabaseのカスタムドメインを使用する**
   - Supabase Proプランでカスタムドメインを設定（月額$10）
   - これにより、認証エンドポイントのURLが変更されます

## 確認手順

### 1. Supabaseの設定を確認

```
Supabaseダッシュボード → Authentication → Providers → Google
- Client ID: [設定されているか確認]
- Client Secret: [設定されているか確認]
```

### 2. Google Cloud Consoleの設定を確認

```
Google Cloud Console → APIとサービス → OAuth同意画面
- ブランディングタブ → アプリ名: [変更した内容が保存されているか確認]
- 認証情報 → OAuth 2.0 クライアント ID: [SupabaseのClient IDと一致するか確認]
```

### 3. テスト手順

1. ブラウザのキャッシュをクリア
2. シークレットモードでテスト
3. アプリのログインページで「Googleでログイン」をクリック
4. Googleログイン画面でアプリ名が変更されているか確認

## 参考リンク

- [Supabase Authentication - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console - OAuth同意画面](https://console.cloud.google.com/apis/credentials/consent)

