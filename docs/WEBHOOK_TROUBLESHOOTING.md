# Webhook トラブルシューティングガイド

## 現在の状況
- Webhookエンドポイント: `vibrant-voyage`
- URL: `https://slang-cantonese-app.vercel.app/api/webhooks/stripe`
- エラー発生率: 100%

## 確認手順

### 1. Stripeダッシュボードでエラーの詳細を確認

1. **Stripeダッシュボードにアクセス**
   - https://dashboard.stripe.com/webhooks
   - `vibrant-voyage` をクリック

2. **「最近の配信」タブを開く**
   - 失敗したWebhookイベントをクリック
   - **エラーメッセージをコピー**

3. **確認すべきエラーメッセージ**
   - `403 Forbidden` → 認証エラー（Webhookシークレットが間違っている）
   - `404 Not Found` → URLが間違っている
   - `500 Internal Server Error` → サーバー側のエラー
   - `307 Temporary Redirect` → URLの末尾にスラッシュが必要な可能性

### 2. Webhook URLの確認

**正しいURL:**
```
https://slang-cantonese-app.vercel.app/api/webhooks/stripe
```

**確認ポイント:**
- `/api/webhooks/stripe` （`stripe`で終わる）
- `/api/webhooks/strip` ではない（`strip`は間違い）
- 末尾にスラッシュは不要

### 3. Webhookシークレットの確認

**Vercelの環境変数を確認:**
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. `STRIPE_WEBHOOK_SECRET` が設定されているか確認
3. Stripeダッシュボードの「署名シークレット」と一致しているか確認

**Stripeダッシュボードで確認:**
1. Webhookエンドポイントをクリック
2. 「署名シークレット」セクションを確認
3. `whsec_...` で始まるシークレットをコピー

### 4. Vercelのログを確認

```bash
# Vercel CLIでログを確認
vercel logs --since 1h | grep -i "webhook\|stripe"
```

または、Vercelダッシュボードの「Functions」タブでログを確認

### 5. エンドポイントの動作確認

**テストエンドポイント:**
```bash
curl https://slang-cantonese-app.vercel.app/api/test
```

**Webhookステータス確認:**
```bash
curl https://slang-cantonese-app.vercel.app/api/stripe/webhook-status
```

## よくある問題と解決方法

### 問題1: 403 Forbidden
**原因:** Webhookシークレットが間違っている
**解決方法:**
1. Stripeダッシュボードで署名シークレットを確認
2. Vercelの環境変数 `STRIPE_WEBHOOK_SECRET` を更新
3. Vercelを再デプロイ

### 問題2: 404 Not Found
**原因:** URLが間違っている
**解決方法:**
1. Webhook URLが `/api/webhooks/stripe` であることを確認
2. 末尾にスラッシュがないことを確認
3. 正しいURLでWebhookエンドポイントを再作成

### 問題3: 500 Internal Server Error
**原因:** サーバー側のエラー
**解決方法:**
1. Vercelのログでエラーの詳細を確認
2. 環境変数が正しく設定されているか確認
3. コードのエラーを修正

### 問題4: 307 Temporary Redirect
**原因:** URLの末尾にスラッシュが必要
**解決方法:**
1. Webhook URLを `/api/webhooks/stripe/` に変更
2. または、Next.jsの設定でリダイレクトを無効化

## 次のステップ

1. **Stripeダッシュボードでエラーメッセージを確認**
2. **エラーメッセージをコピーして共有**
3. **上記の解決方法を試す**

