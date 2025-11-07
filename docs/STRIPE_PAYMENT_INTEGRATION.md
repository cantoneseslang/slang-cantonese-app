# Stripe決済統合ガイド

## 概要

このドキュメントでは、Stripe経由での支払い機能の実装方法と設定手順を説明します。

## 実装内容

### 1. Stripe Checkoutセッション作成API

**ファイル**: `app/api/stripe/create-checkout-session/route.ts`

- プラン（subscription/lifetime）に応じてStripe Checkoutセッションを作成
- 成功時とキャンセル時のリダイレクトURLを設定
- ユーザーIDとプラン情報をメタデータとして保存

### 2. Stripe Webhookエンドポイント

**ファイル**: `app/api/webhooks/stripe/route.ts`

- `checkout.session.completed`: 支払い完了時にユーザーの会員種別を更新
- `customer.subscription.updated`: サブスクリプション更新時に有効期限を更新
- `customer.subscription.deleted`: サブスクリプションキャンセル時に有効期限を設定

### 3. フロントエンド統合

**ファイル**: `app/page.tsx`

- `handleStripeCheckout`関数を修正してStripe Checkoutにリダイレクト
- 無料プランの場合は直接Supabaseを更新
- 有料プランの場合はStripe Checkoutセッションを作成してリダイレクト

### 4. 支払い完了ページ

**ファイル**: `app/payment/success/page.tsx`

- 支払い完了後の表示ページ
- ユーザー情報を再取得して会員種別を更新

**ファイル**: `app/payment/cancel/page.tsx`

- 支払いキャンセル時の表示ページ

## 環境変数の設定

以下の環境変数を設定する必要があります：

### Vercel環境変数

1. **STRIPE_SECRET_KEY**
   - Stripeダッシュボードの「開発者」→「APIキー」から取得
   - 本番環境では本番キー、開発環境ではテストキーを使用

2. **STRIPE_WEBHOOK_SECRET**
   - Stripeダッシュボードの「開発者」→「Webhook」から取得
   - Webhookエンドポイントを作成した際に生成されるシークレット

3. **NEXT_PUBLIC_APP_URL**
   - アプリケーションのベースURL（例: `https://your-domain.com`）
   - 開発環境では `http://localhost:3000`

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Supabaseダッシュボードの「設定」→「API」から取得
   - サービスロールキー（管理者権限）

5. **NEXT_PUBLIC_SUPABASE_URL**
   - SupabaseプロジェクトのURL

## Stripe Webhookの設定

### 1. Webhookエンドポイントの作成

1. Stripeダッシュボードにログイン
2. 「開発者」→「Webhook」に移動
3. 「エンドポイントを追加」をクリック
4. エンドポイントURLを入力: `https://your-domain.com/api/webhooks/stripe`
5. 受信するイベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 2. Webhookシークレットの取得

1. 作成したWebhookエンドポイントをクリック
2. 「署名シークレット」をコピー
3. Vercelの環境変数`STRIPE_WEBHOOK_SECRET`に設定

### 3. ローカル開発時のWebhookテスト

ローカル開発時はStripe CLIを使用してWebhookをテストできます：

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# Stripe CLIにログイン
stripe login

# Webhookをローカルに転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 価格設定

現在の価格設定（`app/api/stripe/create-checkout-session/route.ts`内）：

- **シルバー会員（月額）**: ¥980/月（JPY）
- **ゴールド会員（買い切り）**: ¥9,800（JPY）

価格を変更する場合は、`priceMap`オブジェクトを編集してください。

## フロー

### 1. ユーザーがプランを選択

1. ユーザーがプランカードをクリック
2. `handleMembershipChange`が呼び出される
3. プラン変更モーダルが表示される

### 2. 支払いボタンをクリック

1. 「今すぐアップグレード」ボタンをクリック
2. `handleStripeCheckout`が呼び出される
3. 無料プランの場合は直接Supabaseを更新
4. 有料プランの場合はStripe Checkoutセッションを作成

### 3. Stripe Checkoutで支払い

1. Stripe Checkoutページにリダイレクト
2. ユーザーが支払い情報を入力
3. 支払いを完了

### 4. 支払い完了後の処理

1. StripeがWebhookを送信
2. `app/api/webhooks/stripe/route.ts`がWebhookを受信
3. ユーザーの会員種別を更新
4. サブスクリプションの場合は有効期限を設定
5. ユーザーは`/payment/success`にリダイレクト

## テスト方法

### テストカード番号

Stripeのテストモードでは以下のカード番号を使用できます：

- **成功**: `4242 4242 4242 4242`
- **3Dセキュア認証が必要**: `4000 0025 0000 3155`
- **失敗**: `4000 0000 0000 0002`

有効期限: 任意の未来の日付（例: `12/34`）
CVC: 任意の3桁（例: `123`）
郵便番号: 任意の5桁（例: `12345`）

### テスト手順

1. Stripeダッシュボードでテストモードに切り替え
2. アプリケーションでプランを選択
3. テストカード番号で支払いを完了
4. Stripeダッシュボードで支払いを確認
5. Supabaseでユーザーの会員種別が更新されているか確認

## トラブルシューティング

### Webhookが受信されない

1. StripeダッシュボードでWebhookのログを確認
2. エンドポイントURLが正しいか確認
3. Webhookシークレットが正しく設定されているか確認
4. Vercelのログでエラーを確認

### ユーザーの会員種別が更新されない

1. Supabaseのログでエラーを確認
2. `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認
3. Webhookのメタデータに`user_id`と`plan`が含まれているか確認

### リダイレクトが正しく動作しない

1. `NEXT_PUBLIC_APP_URL`が正しく設定されているか確認
2. Stripe Checkoutセッションの`success_url`と`cancel_url`を確認

## セキュリティ考慮事項

1. **Webhook署名の検証**: Webhookエンドポイントでは必ず署名を検証
2. **サービスロールキーの保護**: `SUPABASE_SERVICE_ROLE_KEY`はサーバーサイドでのみ使用
3. **メタデータの検証**: Webhookで受信したメタデータを検証
4. **エラーハンドリング**: 適切なエラーハンドリングを実装

## 参考リンク

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

