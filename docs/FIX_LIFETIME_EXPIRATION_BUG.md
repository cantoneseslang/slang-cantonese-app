# ゴールド会員（lifetime）有効期限バグ修正ガイド

## 🐛 バグの概要

### 問題
ゴールド会員（lifetime、買い切りプラン）の有効期限が**2年後**に設定されていた。

### 原因
Webhookで有効期限を計算する際、以下の問題がありました：

1. **サブスクリプション情報から期間終了日を取得しようとしていた**
   - lifetimeは `mode: 'payment'`（一回払い）のため、サブスクリプションではない
   - しかし、コードはサブスクリプション情報を取得して +1年 していた

2. **Webhookが複数回処理される可能性**
   - 初回: 購入日 + 1年
   - 2回目: すでに設定された日付 + 1年
   - 結果: 2027年になる

### 修正内容
`app/api/webhooks/stripe/route.ts` で、lifetimeプランの場合は**常に購入日から1年後**に設定するように変更しました。

---

## ✅ 修正済みのコード

### 変更前（バグあり）
```typescript
// サブスクリプション情報から期間終了日を取得
const subscription = await stripe.subscriptions.retrieve(session.subscription);
const currentPeriodEnd = subscription.current_period_end;

if (plan === 'lifetime') {
  // ゴールド会員: 現在の期間終了日の1年後
  const expiresDate = new Date(currentPeriodEnd);
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  expiresAt = expiresDate.toISOString();
}
```

### 変更後（修正済み）
```typescript
// lifetimeプラン（買い切り）の場合は、常に購入日から1年後に設定
if (plan === 'lifetime') {
  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  expiresAt = expiresDate.toISOString();
  console.log('✅ ゴールド会員（lifetime）: 購入日から1年後に設定', {
    expiresAt,
    purchaseDate: new Date().toISOString()
  });
}
```

---

## 🔧 既存ユーザーの有効期限を修正する方法

### 方法1: Supabase SQL Editor で修正

以下のSQLを実行して、影響を受けたユーザーを特定します：

```sql
-- lifetime会員で有効期限が2年以上先のユーザーを検索
SELECT 
  id,
  email,
  raw_user_meta_data->>'membership_type' as membership_type,
  raw_user_meta_data->>'subscription_expires_at' as expires_at,
  created_at,
  (raw_user_meta_data->>'subscription_expires_at')::timestamp - created_at as diff
FROM auth.users
WHERE raw_user_meta_data->>'membership_type' = 'lifetime'
  AND (raw_user_meta_data->>'subscription_expires_at')::timestamp > NOW() + interval '18 months';
```

### 特定のユーザーの有効期限を修正（例）

```sql
-- ユーザーIDを指定して有効期限を修正
-- 購入日から1年後に設定する例

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{subscription_expires_at}',
  to_jsonb((created_at + interval '1 year')::text)
)
WHERE id = 'あなたのユーザーID'
  AND raw_user_meta_data->>'membership_type' = 'lifetime';
```

### 全てのlifetime会員を一括修正（慎重に）

```sql
-- ⚠️ 注意: 全てのlifetime会員の有効期限を購入日+1年に修正
-- 実行前に必ずバックアップを取ってください

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{subscription_expires_at}',
  to_jsonb((created_at + interval '1 year')::text)
)
WHERE raw_user_meta_data->>'membership_type' = 'lifetime'
  AND (raw_user_meta_data->>'subscription_expires_at')::timestamp > created_at + interval '18 months';
```

---

### 方法2: TypeScriptスクリプトで修正

`scripts/fix-lifetime-expiration.ts` を実行：

```bash
# 確認モード（修正はしない）
npx tsx scripts/fix-lifetime-expiration.ts

# 実際に修正する場合は、スクリプト内のコメントを外してから実行
```

---

## 🧪 テスト方法

### 1. 新規購入のテスト

1. Stripeテストモードでゴールド会員を購入
2. Webhookログを確認（Vercel Logs）
3. 有効期限が**購入日から1年後**になっているか確認

### 2. Webhookログの確認

```bash
# Vercelログを確認
vercel logs --since 1h | grep "ゴールド会員"
```

期待されるログ：
```
✅ ゴールド会員（lifetime）: 購入日から1年後に設定 {
  expiresAt: '2026-11-19T...',
  purchaseDate: '2025-11-19T...'
}
```

---

## 📝 影響を受けたユーザーの確認

### Supabase Dashboard

1. **Authentication** → **Users** を開く
2. lifetime会員を検索
3. `subscription_expires_at` を確認
4. 有効期限が2年以上先（2027年以降）の場合は修正が必要

---

## 🚀 デプロイ

修正後、必ずデプロイしてください：

```bash
git add .
git commit -m "Fix: ゴールド会員（lifetime）の有効期限計算バグを修正"
git push
```

Vercelが自動的にデプロイします。

---

## 📊 今後の予防策

1. **テストケースを追加**
   - lifetime購入時の有効期限が正しいか確認するテスト
   - Webhook が複数回呼ばれても問題ないか確認

2. **ログの監視**
   - Webhookログで有効期限を確認
   - 異常な日付（2年以上先）が検出されたらアラート

3. **定期チェック**
   - 月1回、lifetime会員の有効期限をチェック
   - 異常値があれば修正

---

## ❓ FAQ

### Q: なぜ2027年になったのか？
A: Webhookが2回処理され、それぞれで +1年 されたため。

### Q: 他のユーザーも影響を受けているか？
A: 上記のSQLで確認できます。lifetimeプランを購入した全ユーザーが影響を受けている可能性があります。

### Q: subscriptionプラン（月額）は影響ないか？
A: ありません。subscriptionプランは正しくサブスクリプション情報から期間を取得しています。

---

## 📞 問題が解決しない場合

1. Vercelログを確認
2. Supabaseログを確認
3. Stripeダッシュボードで Webhookイベントを確認

問題が継続する場合は、お知らせください。

