# Stripeテストモード設定ガイド

## 概要

Stripeのテストモードで決済フローをテストするための設定方法です。

## テストモードの判定

StripeのAPIキーが`sk_test_`で始まる場合、自動的にテストモードとして判定されます。

## 環境変数の設定

### Vercel環境変数

以下の環境変数をVercelのダッシュボードで設定してください：

1. **テストモード用のAPIキー**
   - `STRIPE_SECRET_KEY`: `sk_test_...`（Stripeダッシュボードの「開発者」→「APIキー」から取得）

2. **テストモード用のWebhookシークレット**
   - `STRIPE_WEBHOOK_SECRET`: `whsec_test_...`（Stripeダッシュボードの「開発者」→「Webhook」から取得）

3. **テストモード用の価格ID（オプション）**
   - `STRIPE_PRICE_ID_SUBSCRIPTION_JPY`: テスト用のシルバー会員（月額）JPY価格ID
   - `STRIPE_PRICE_ID_SUBSCRIPTION_HKD`: テスト用のシルバー会員（月額）HKD価格ID
   - `STRIPE_PRICE_ID_LIFETIME_JPY`: テスト用のゴールド会員（買い切り）JPY価格ID
   - `STRIPE_PRICE_ID_LIFETIME_HKD`: テスト用のゴールド会員（買い切り）HKD価格ID

## テスト用カード番号

Stripeのテストモードでは、以下のテスト用カード番号を使用できます：

### 成功するカード
- **カード番号**: `4242 4242 4242 4242`
- **有効期限**: 任意の未来の日付（例: `12/34`）
- **CVC**: 任意の3桁の数字（例: `123`）
- **郵便番号**: 任意の5桁の数字（例: `12345`）

### その他のテストカード
- **3Dセキュア認証が必要**: `4000 0025 0000 3155`
- **認証失敗**: `4000 0000 0000 0002`
- **カード不足**: `4000 0000 0000 9995`
- **処理エラー**: `4000 0000 0000 0119`

詳細は[Stripe Testing](https://stripe.com/docs/testing)を参照してください。

## テスト手順

1. **環境変数の設定**
   - Vercelダッシュボードで`STRIPE_SECRET_KEY`にテスト用のAPIキーを設定
   - `STRIPE_WEBHOOK_SECRET`にテスト用のWebhookシークレットを設定

2. **Webhookの設定**
   - Stripeダッシュボードの「開発者」→「Webhook」で、テストモード用のエンドポイントを追加
   - エンドポイントURL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **決済テスト**
   - アプリでプランを選択して決済フローを開始
   - Stripe Checkoutページでテスト用カード番号を入力
   - 決済が完了すると、`/payment/success`ページにリダイレクトされます

4. **Webhookの確認**
   - Stripeダッシュボードの「開発者」→「Webhook」で、Webhookイベントのログを確認
   - イベントが正常に送信されているか確認

5. **ユーザー情報の確認**
   - Supabaseダッシュボードで、ユーザーの`membership_type`と`subscription_expires_at`が正しく更新されているか確認

## 本番モードへの切り替え

本番環境にデプロイする際は、以下の環境変数を本番用の値に変更してください：

1. `STRIPE_SECRET_KEY`: `sk_live_...`（本番用のAPIキー）
2. `STRIPE_WEBHOOK_SECRET`: `whsec_...`（本番用のWebhookシークレット）
3. 価格ID: 本番用の価格IDに変更

## トラブルシューティング

### Webhookが動作しない場合

1. StripeダッシュボードでWebhookイベントのログを確認
2. Vercelのログでエラーを確認
3. `STRIPE_WEBHOOK_SECRET`が正しく設定されているか確認

### 決済が完了しない場合

1. Stripeダッシュボードの「支払い」セクションで決済の状態を確認
2. ブラウザのコンソールでエラーを確認
3. Vercelのログでエラーを確認

### ユーザー情報が更新されない場合

1. Supabaseダッシュボードでユーザーの`user_metadata`を確認
2. Webhookイベントが正常に処理されているか確認
3. `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認

