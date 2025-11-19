# Stripe Webhookイベント分析

## イベントID
`evt_1SU7o3LopXhymmb3dzpxPMGl`

## 確認方法

### 1. APIエンドポイントを使用
新しく作成した`/api/stripe/get-event`エンドポイントを使用してイベントの詳細を取得できます。

```bash
# 本番環境
curl "https://slang-cantonese-app.vercel.app/api/stripe/get-event?eventId=evt_1SU7o3LopXhymmb3dzpxPMGl"

# ローカル環境
curl "http://localhost:3000/api/stripe/get-event?eventId=evt_1SU7o3LopXhymmb3dzpxPMGl"
```

### 2. Stripeダッシュボードで確認
- [StripeダッシュボードのWebhookイベント](https://dashboard.stripe.com/acct_1NGFrXLopXhymmb3/workbench/webhooks/we_1SQigqLopXhymmb3JlI6IoQD/events?attemptId=wc_1SUCTuLopXhymmb3aQ2aAeAe&filters[search]=evt_1SU7o3LopXhymmb3dzpxPMGl)
- イベントの詳細、配信状況、エラーメッセージを確認できます

### 3. Vercelのログで確認
- VercelダッシュボードのFunctionsタブでログを確認
- Webhookエンドポイント（`/api/webhooks/stripe`）のログを確認

## 確認すべき項目

### 1. イベントタイプ
- どのイベントタイプが発生したか（例: `checkout.session.completed`, `payment_intent.succeeded`）

### 2. 配信状況
- イベントが正常に配信されたか
- エラーが発生した場合、エラーメッセージは何か

### 3. HTTPステータスコード
- Webhookエンドポイントが返したHTTPステータスコード
- 200以外の場合はエラーの原因を確認

### 4. リトライ状況
- イベントがリトライされているか
- リトライ回数と次回リトライ予定時刻

### 5. イベントデータ
- イベントに含まれるデータ（metadata、customer情報など）
- 処理に必要な情報が含まれているか

## よくある問題

### 1. 307リダイレクトエラー
- **原因**: Middlewareの認証チェックでログインページにリダイレクト
- **解決策**: `/api/webhooks/stripe`は認証不要に設定済み

### 2. シグネチャ検証エラー
- **原因**: Webhookシークレットが正しく設定されていない
- **解決策**: `STRIPE_WEBHOOK_SECRET`環境変数を確認

### 3. タイムアウトエラー
- **原因**: Webhookエンドポイントの処理が長時間かかっている
- **解決策**: 処理を非同期化し、すぐに200レスポンスを返す

## 関連ファイル

- `app/api/stripe/get-event/route.ts`: イベント詳細取得エンドポイント（新規作成）
- `app/api/webhooks/stripe/route.ts`: Webhook処理エンドポイント
- `app/api/stripe/webhook-status/route.ts`: Webhookステータス確認エンドポイント
- `middleware.ts`: 認証チェック設定




