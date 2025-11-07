# テスト期間設定ガイド

## 概要

テスト期間中に期日を設定し、その期日が来たらすべてのユーザーを強制的にブロンズ会員に戻す機能です。

## 設定方法

### 1. 環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定してください：

**Key**: `TEST_PERIOD_END_DATE`  
**Value**: `2025-12-31T23:59:59Z`（希望の日時に変更）

**設定手順**:
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 「Add New」をクリック
3. Keyに`TEST_PERIOD_END_DATE`を入力
4. Valueに日時を入力（例: `2025-12-31T23:59:59Z`）
5. Environment: Production, Preview, Development すべてに適用
6. 「Save」をクリック

**形式**: ISO 8601形式の日時文字列（UTC推奨）
**例**:
- `2025-12-31T23:59:59Z` - 2025年12月31日23時59分59秒（UTC）
- `2025-12-31T23:59:59+09:00` - 日本時間（JST）で2025年12月31日23時59分59秒
- `2026-01-15T00:00:00Z` - 2026年1月15日0時0分0秒（UTC）

### 2. Cron Jobの設定

`vercel.json`でCron Jobが設定されていることを確認してください：

```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscription-expiration",
      "schedule": "0 0 * * *"
    }
  ]
}
```

この設定により、毎日0時（UTC）にCron Jobが実行され、テスト期間終了日をチェックします。

## 動作

### テスト期間中

- ユーザーは通常通りシルバー/ゴールド会員になれます
- 通常のサブスクリプション期限チェックも実行されます

### テスト期間終了時

- 現在日時が`TEST_PERIOD_END_DATE`を過ぎた場合、Cron Jobが実行されると：
  1. **すべての有料会員（シルバー・ゴールド）をブロンズに戻す**
  2. `subscription_expires_at`を`null`に設定
  3. `user_metadata`も更新

### テスト期間終了後

- 通常のサブスクリプション期限チェックのみ実行されます
- 新規の有料会員登録は通常通り動作します

## 手動実行

テスト期間を即座に終了させたい場合は、以下のコマンドでCron Jobを手動実行できます：

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/check-subscription-expiration" \
  -H "Authorization: Bearer your-cron-secret"
```

## 確認方法

### 1. ログの確認

VercelのダッシュボードでCron Jobのログを確認：
- テスト期間終了時: `テスト期間が終了しました。すべての有料会員をブロンズに戻します。`
- 通常の期限チェック: `Downgraded X expired subscriptions to free tier`

### 2. Supabaseでの確認

Supabaseダッシュボードで`users`テーブルを確認：
- `membership_type`が`free`になっているか
- `subscription_expires_at`が`null`になっているか

### 3. レスポンスの確認

Cron Jobのレスポンスで確認：
```json
{
  "success": true,
  "testPeriodEnded": true,
  "testPeriodDowngradeCount": 10,
  "updatedCount": 0,
  "message": "テスト期間終了により10人の有料会員をブロンズに戻しました。また、0人の期限切れサブスクリプション会員をブロンズに戻しました。"
}
```

## 注意事項

1. **タイムゾーン**: `TEST_PERIOD_END_DATE`はUTCで設定してください。日本時間で設定する場合は、`+09:00`を付けてください。

2. **一度だけ実行**: テスト期間終了処理は、テスト期間終了日を過ぎた最初のCron Job実行時に1回だけ実行されます。

3. **データのバックアップ**: テスト期間終了前に、必要に応じてデータのバックアップを取得してください。

4. **通知**: テスト期間終了前にユーザーに通知する場合は、別途実装が必要です。

## トラブルシューティング

### テスト期間終了処理が実行されない場合

1. `TEST_PERIOD_END_DATE`が正しく設定されているか確認
2. Cron Jobが実行されているか確認（Vercelダッシュボードのログを確認）
3. 現在日時が`TEST_PERIOD_END_DATE`を過ぎているか確認

### 一部のユーザーがブロンズに戻らない場合

1. Supabaseのログでエラーを確認
2. `user_metadata`の更新が失敗していないか確認
3. 手動でCron Jobを実行してエラーを確認

