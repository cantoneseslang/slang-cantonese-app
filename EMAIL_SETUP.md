# メール確認設定ガイド

新規登録後に確認メールが届かない場合は、以下の設定を確認してください。

## 1. Supabaseダッシュボードでの設定

### Site URLの設定
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. **Authentication** → **URL Configuration** に移動
4. **Site URL** を設定:
   - 本番環境: `https://slang-cantonese-app.vercel.app`
   - 開発環境: `http://localhost:3000`

### リダイレクトURLの追加
同じページで、**Redirect URLs** セクションに以下を追加:
- `https://slang-cantonese-app.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback` (開発環境の場合)

### メール確認の有効化
1. **Authentication** → **Providers** → **Email** に移動
2. **Enable email confirmations** が有効になっていることを確認
3. **Confirm email** が有効になっていることを確認

## 2. メールテンプレートの確認

1. **Authentication** → **Email Templates** に移動
2. **Confirm signup** テンプレートを確認
3. 確認URLが正しく設定されていることを確認:
   - リンクには `{{ .ConfirmationURL }}` が含まれている必要があります

## 3. メールが届かない場合の確認事項

### スパムフォルダを確認
メールプロバイダーによっては、確認メールがスパムフォルダに分類される場合があります。

### メールアドレスの確認
- 正しいメールアドレスを入力したか確認
- タイポがないか確認

### メール送信ログの確認
1. Supabaseダッシュボードで **Logs** → **Auth** を確認
2. メール送信のログがあるか確認

## 4. 開発環境での注意

ローカル開発環境では、Supabaseのデフォルト設定ではメールが送信されない場合があります。
開発環境でテストする場合は、Supabaseダッシュボードで **Settings** → **API** → **SMTP Settings** でメール送信を設定するか、メール確認を一時的に無効化してテストできます。

## 5. メール確認を無効化する場合（開発時のみ）

**Authentication** → **Providers** → **Email** で:
- **Enable email confirmations** を無効化
- **Confirm email** を無効化

⚠️ **本番環境ではメール確認を必ず有効にしてください**

## 6. メール送信のトラブルシューティング

メールが届かない場合、以下を確認:

1. **Supabaseログ**: ダッシュボードでメール送信エラーがないか確認
2. **リダイレクトURL**: 設定が正しいか確認
3. **Site URL**: 本番環境のURLが正しく設定されているか確認
4. **メールプロバイダー**: Gmail、Outlookなど、一部のプロバイダーではメールが遅延する場合があります

## 追加の設定（オプション）

カスタムSMTPを使用する場合:
1. **Settings** → **Auth** → **SMTP Settings**
2. カスタムSMTPサーバーを設定

これにより、より信頼性の高いメール配信が可能になります。



