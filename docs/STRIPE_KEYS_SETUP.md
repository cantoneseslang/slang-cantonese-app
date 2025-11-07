# Stripe APIキーとWebhookシークレットの取得方法

## 1. STRIPE_SECRET_KEY（シークレットキー）の取得

### 手順

1. **Stripeダッシュボードにログイン**
   - https://dashboard.stripe.com/ にアクセス
   - アカウントにログイン

2. **左側のメニューから直接アクセス**
   - 左側のメニューで「開発者」をクリック
   - サブメニューが表示されるので、「APIキー」をクリック
   - または、直接 https://dashboard.stripe.com/apikeys にアクセス

   **注意**: 「設定 > 開発者」ページではなく、左側メニューの「開発者」から直接アクセスしてください。

4. **シークレットキーをコピー**
   - 「シークレットキー」の横にある「表示」ボタンをクリック
   - 表示されたキーをコピー
   - **重要**: 
     - **テストモード**の場合: `sk_test_...` で始まるキー
     - **本番モード**の場合: `sk_live_...` で始まるキー
   - 本番環境では必ず本番キーを使用してください

### 注意事項

- **シークレットキーは絶対に公開しないでください**
- GitHubなどにコミットしないでください
- Vercelの環境変数に設定してください
- テストモードと本番モードで異なるキーがあります

## 2. STRIPE_WEBHOOK_SECRET（Webhookシークレット）の取得

### 手順

1. **Stripeダッシュボードにログイン**
   - https://dashboard.stripe.com/ にアクセス

2. **左側のメニューから直接アクセス**
   - 左側のメニューで「開発者」をクリック
   - サブメニューが表示されるので、「Webhook」をクリック
   - または、直接 https://dashboard.stripe.com/webhooks にアクセス

   **注意**: 「設定 > 開発者」ページではなく、左側メニューの「開発者」から直接アクセスしてください。
   - 「エンドポイントを追加」ボタンをクリック

3. **エンドポイントURLを入力**
   - エンドポイントURL: `https://your-domain.com/api/webhooks/stripe`
   - 例: `https://slang-cantonese-app.vercel.app/api/webhooks/stripe`
   - **重要**: 本番環境のURLを入力してください

4. **受信するイベントを選択**
   - 「イベントを選択」をクリック
   - 以下のイベントを選択:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - 「イベントを追加」をクリック

5. **エンドポイントを追加**
   - 「エンドポイントを追加」ボタンをクリック

6. **署名シークレットをコピー**
   - 作成されたWebhookエンドポイントをクリック
   - 「署名シークレット」セクションを確認
   - 「表示」ボタンをクリックしてシークレットを表示
   - `whsec_...` で始まるシークレットをコピー

### ローカル開発時のWebhookテスト

ローカル開発時はStripe CLIを使用してWebhookをテストできます：

```bash
# Stripe CLIをインストール（macOS）
brew install stripe/stripe-cli/stripe

# Stripe CLIにログイン
stripe login

# Webhookをローカルに転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

このコマンドを実行すると、`whsec_...` で始まるローカル用のWebhookシークレットが表示されます。これをローカル開発用の環境変数に設定してください。

## 3. Vercelでの環境変数の設定

### 手順

1. **Vercelダッシュボードにログイン**
   - https://vercel.com/dashboard にアクセス

2. **プロジェクトを選択**
   - 対象のプロジェクトをクリック

3. **設定を開く**
   - 「Settings」タブをクリック
   - 左側のメニューから「Environment Variables」をクリック

4. **環境変数を追加**
   - 「Add New」ボタンをクリック
   - 以下の環境変数を追加:

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` または `sk_live_...` | Production, Preview, Development |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production, Preview, Development |

5. **保存**
   - 「Save」ボタンをクリック
   - 変更を反映するために再デプロイが必要な場合があります

## 4. 確認方法

### Stripe APIキーの確認

1. Stripeダッシュボードの「開発者」→「APIキー」で確認
2. テストモードと本番モードを切り替えて確認

### Webhookエンドポイントの確認

1. Stripeダッシュボードの「開発者」→「Webhook」で確認
2. エンドポイントのステータスが「有効」になっているか確認
3. 「テスト」ボタンでWebhookをテストできます

## 5. トラブルシューティング

### Webhookが受信されない

1. **エンドポイントURLを確認**
   - 正しいURLが設定されているか確認
   - HTTPSを使用しているか確認

2. **署名シークレットを確認**
   - 正しいシークレットが設定されているか確認
   - テストモードと本番モードで異なるシークレットを使用

3. **ログを確認**
   - Stripeダッシュボードの「開発者」→「Webhook」→「ログ」で確認
   - Vercelのログでエラーを確認

### APIキーが正しく動作しない

1. **テストモードと本番モードを確認**
   - テスト環境では `sk_test_...` を使用
   - 本番環境では `sk_live_...` を使用

2. **キーの権限を確認**
   - シークレットキーにはすべての権限があります
   - 公開可能キー（`pk_...`）は使用しないでください

## 参考リンク

- [Stripe API Keys Documentation](https://stripe.com/docs/keys)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

