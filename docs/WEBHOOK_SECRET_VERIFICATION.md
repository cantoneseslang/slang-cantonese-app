# Webhookシークレット確認ガイド

## 確認済みのWebhookシークレット

```
STRIPE_WEBHOOK_SECRET=whsec_aLMtzsOcZJ4uktbHj3Uu2vjDWsDkeL63
```

## Vercel環境変数の確認手順

### 1. Vercelダッシュボードで確認

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard
   - プロジェクトを選択

2. **環境変数を確認**
   - 「Settings」タブをクリック
   - 左側のメニューから「Environment Variables」をクリック
   - `STRIPE_WEBHOOK_SECRET` を検索

3. **値の確認**
   - 値が `whsec_aLMtzsOcZJ4uktbHj3Uu2vjDWsDkeL63` と一致しているか確認
   - 環境（Production, Preview, Development）が正しく設定されているか確認

### 2. 環境変数の更新が必要な場合

1. **環境変数を編集**
   - `STRIPE_WEBHOOK_SECRET` をクリック
   - 値を `whsec_aLMtzsOcZJ4uktbHj3Uu2vjDWsDkeL63` に設定
   - 「Save」をクリック

2. **再デプロイ**
   - 環境変数を変更した後、再デプロイが必要な場合があります
   - 「Deployments」タブから最新のデプロイメントを確認

## コード内での使用箇所

### 1. Webhookエンドポイント
**ファイル**: `app/api/webhooks/stripe/route.ts`

```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
```

### 2. Webhook検証
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### 3. エラーハンドリング
```typescript
if (!webhookSecret) {
  console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
  return NextResponse.json(
    { error: 'Webhook secret not configured' },
    { status: 500 }
  );
}
```

## 動作確認方法

### 1. ヘルスチェックエンドポイントを使用

```bash
curl https://slang-cantonese-app.vercel.app/api/health-check
```

レスポンスに以下が含まれているか確認：
```json
{
  "hasWebhookSecret": true,
  "webhookSecretLength": 51
}
```

### 2. Webhookステータスエンドポイントを使用

```bash
curl https://slang-cantonese-app.vercel.app/api/stripe/webhook-status
```

レスポンスに以下が含まれているか確認：
```json
{
  "webhookEndpoint": "Configured"
}
```

### 3. Vercelのログで確認

1. Vercelダッシュボード → プロジェクト → 「Functions」タブ
2. `/api/webhooks/stripe` のログを確認
3. 以下のログが表示されているか確認：
   ```
   🔔 Webhook received: {
     hasSignature: true,
     hasWebhookSecret: true,
     bodyLength: ...
   }
   ```

## トラブルシューティング

### 1. Webhookシークレットが設定されていない場合

**症状**: 
- `hasWebhookSecret: false` がログに表示される
- `❌ STRIPE_WEBHOOK_SECRET is not set` エラーが発生

**解決策**:
- Vercelの環境変数に `STRIPE_WEBHOOK_SECRET` を設定
- 再デプロイを実行

### 2. Webhookシークレットが間違っている場合

**症状**:
- `StripeSignatureVerificationError` が発生
- Webhookイベントが検証に失敗する

**解決策**:
- Stripeダッシュボードの「署名シークレット」と一致しているか確認
- Vercelの環境変数を更新して再デプロイ

### 3. 環境変数が反映されていない場合

**症状**:
- 環境変数を設定したが、コードで読み取れない

**解決策**:
- 環境変数の環境設定（Production, Preview, Development）を確認
- 再デプロイを実行
- Vercelの「Settings」→「Environment Variables」で確認

## 関連ドキュメント

- [Stripe Webhook設定ガイド](docs/WEBHOOK_TROUBLESHOOTING.md)
- [Stripe決済統合ガイド](docs/STRIPE_PAYMENT_INTEGRATION.md)
- [Stripe環境変数設定ガイド](docs/STRIPE_KEYS_SETUP.md)




