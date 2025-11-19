# Stripe API 307リダイレクトエラーの修正

## 問題の概要

Stripe APIエンドポイント（`/api/stripe/*`）へのリクエストが307リダイレクト（ログインページへのリダイレクト）を返す問題が発生していました。

## 問題の原因

### 1. Middlewareの認証チェック
- `middleware.ts`で、`/api/stripe/*`のエンドポイントが認証チェックの対象になっている
- 未認証のリクエスト（認証トークンが切れている、またはStripeからのwebhook）がログインページにリダイレクトされる

### 2. 各エンドポイントの用途
- `/api/stripe/create-checkout-session`: フロントエンドから呼ばれる（認証が必要）
- `/api/stripe/verify-session`: フロントエンドから呼ばれる（認証が必要）
- `/api/stripe/manual-update-membership`: フロントエンドから呼ばれる（認証が必要）
- `/api/stripe/cancel-subscription`: フロントエンドから呼ばれる（認証が必要）
- `/api/stripe/webhook-status`: 管理者用（認証が必要）

### 3. 307リダイレクトが発生するケース
1. **認証トークンが切れている**: フロントエンドから呼ばれる際に、認証トークンが切れている
2. **Stripeからのwebhook**: Stripeからのwebhookが間違ったエンドポイントに送られている（本来は`/api/webhooks/stripe`に送られるべき）
3. **内部処理**: サーバーサイドからの内部処理で認証トークンが含まれていない

## 修正内容

### 1. Middlewareの設定確認
- `/api/stripe/*`は認証が必要なエンドポイントのため、middlewareで認証チェックを行う
- `/api/webhooks/stripe`は認証不要（Stripeからのwebhookのため）

### 2. 各エンドポイント内での認証チェック
- 各エンドポイント内で認証チェックを行う（middlewareで既にチェックされているが、念のため）
- 認証エラーの場合は適切なエラーレスポンスを返す

### 3. エラーハンドリングの改善
- 307リダイレクトではなく、適切なエラーレスポンス（401 Unauthorized）を返す
- エラーメッセージを明確にする

## 確認が必要な項目

1. **フロントエンドからの呼び出し**
   - 認証トークンが正しく送信されているか
   - 認証トークンが切れていないか

2. **Stripe Webhookの設定**
   - Webhook URLが正しく設定されているか（`/api/webhooks/stripe`）
   - Webhookシークレットが正しく設定されているか

3. **エラーログの確認**
   - Vercelのログで307リダイレクトが発生しているエンドポイントを確認
   - StripeダッシュボードでWebhookのエラーを確認

## 関連ファイル

- `middleware.ts`: 認証チェックの設定
- `app/api/stripe/create-checkout-session/route.ts`: Checkoutセッション作成
- `app/api/stripe/verify-session/route.ts`: セッション検証
- `app/api/stripe/manual-update-membership/route.ts`: 手動会員情報更新
- `app/api/stripe/cancel-subscription/route.ts`: サブスクリプションキャンセル
- `app/api/stripe/webhook-status/route.ts`: Webhookステータス確認
- `app/api/webhooks/stripe/route.ts`: Stripe Webhook処理

## 今後の改善点

1. **認証チェックの統一**
   - 各エンドポイント内で認証チェックを行うヘルパー関数を作成
   - エラーレスポンスを統一する

2. **エラーログの改善**
   - 307リダイレクトが発生した場合のログを追加
   - エラーの原因を特定しやすくする

3. **テストの追加**
   - 認証トークンが切れている場合のテスト
   - Stripe Webhookのテスト




