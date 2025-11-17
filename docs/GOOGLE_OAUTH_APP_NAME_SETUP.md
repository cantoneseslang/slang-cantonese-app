# Google OAuthのアプリ名を変更する手順

## 目標
Googleログイン画面の上部に「カントン語音れん」と表示されるように、Google OAuthのアプリ名を変更します。

## 注意事項
- ✅ **無料で設定可能**
- ⚠️ 「qdmvituurfevyibtzwsb.supabase.co/」に移動というURL表示は残ります（これはSupabaseの認証エンドポイントそのものなので変更できません）
- ✅ ただし、アプリ名が「カントン語音れん」と表示されることで、ユーザーがアプリを識別しやすくなります

## 設定手順

### ステップ1: SupabaseダッシュボードでGoogle OAuth設定を確認

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **認証プロバイダー設定を開く**
   - 左側メニューから「Authentication」をクリック
   - 「Providers」タブを選択
   - 「Google」をクリック

3. **Client IDとClient Secretを確認**
   - 「Client ID」と「Client Secret」が設定されているか確認
   - これらが設定されている場合、Supabaseが独自のGoogle OAuthアプリを使用しています
   - 設定されていない場合、SupabaseのデフォルトOAuthアプリを使用しているため、この方法では変更できません

### ステップ2: Google Cloud Consoleにアクセス

1. **Google Cloud Consoleを開く**
   - https://console.cloud.google.com/
   - Supabaseで使用しているGoogle Cloudプロジェクトを選択
   - または、Supabaseダッシュボードの「Authentication」→「Providers」→「Google」で表示されるClient IDからプロジェクトを特定

2. **OAuth同意画面を開く**
   - 左側メニューから「APIとサービス」をクリック
   - 「OAuth同意画面」をクリック

### ステップ3: アプリ名を変更

1. **ブランディングタブを選択**
   - 「ブランディング」タブをクリック

2. **アプリ名を変更**
   - 「アプリ名」フィールドに「カントン語音れん」と入力
   - 必要に応じて、以下の情報も設定できます：
     - **アプリのロゴ**: 120 x 120ピクセルの正方形の画像（JPG、PNG、BMP形式）
     - **サポートメール**: お問い合わせ用のメールアドレス
     - **アプリのホームページ**: `https://slang-cantonese-app.vercel.app`
     - **プライバシーポリシーリンク**: プライバシーポリシーのURL（設定している場合）
     - **利用規約リンク**: 利用規約のURL（設定している場合）

3. **保存**
   - 「保存」ボタンをクリック
   - 変更が反映されるまで数分かかる場合があります

### ステップ4: 動作確認

1. **ログインページでテスト**
   - アプリのログインページにアクセス
   - 「Googleでログイン」ボタンをクリック
   - Googleログイン画面で、上部に「カントン語音れん」と表示されることを確認

2. **表示内容の確認**
   - ✅ アプリ名: 「カントン語音れん」
   - ✅ ロゴ: 設定したロゴ（設定した場合）
   - ⚠️ URL表示: 「qdmvituurfevyibtzwsb.supabase.co/」に移動（これは変更できません）

## トラブルシューティング

### Client IDが見つからない場合

1. **Supabaseダッシュボードで確認**
   - 「Authentication」→「Providers」→「Google」
   - Client IDが表示されていない場合、SupabaseのデフォルトOAuthアプリを使用しています

2. **対処法**
   - SupabaseのデフォルトOAuthアプリを使用している場合、Google Cloud Consoleでの変更はできません
   - この場合、Supabaseダッシュボードでカスタムドメインを設定するか、ログインページに説明を追加することを検討してください

### 変更が反映されない場合

1. **キャッシュをクリア**
   - ブラウザのキャッシュをクリア
   - シークレットモードでテスト

2. **反映時間を待つ**
   - Google OAuthの設定変更は、反映されるまで数分から数時間かかる場合があります
   - しばらく待ってから再度テストしてください

3. **設定を再確認**
   - Google Cloud Consoleで設定が正しく保存されているか確認
   - SupabaseダッシュボードでClient IDとClient Secretが正しく設定されているか確認

## 参考リンク

- [Google Cloud Console - OAuth同意画面](https://console.cloud.google.com/apis/credentials/consent)
- [Supabase Authentication - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)

