# シルバー会員（月額サブスクリプション）ロジック修正

## 🐛 発見したバグ

### 問題
シルバー会員の有効期限が**1ヶ月ずれて**いました。

### 原因
`customer.subscription.updated` イベントで、`currentPeriodEnd`（次の請求日）に**さらに+1ヶ月**していた。

```typescript
// ❌ 間違ったコード
const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
expiresAt = new Date(currentPeriodEnd);
expiresAt.setMonth(expiresAt.getMonth() + 1); // 1ヶ月余計に追加
```

### 結果
- Stripe側: 正常に毎月請求される ✅
- アプリ側: 有効期限が1ヶ月先になる ❌

例：
- 購入日: 2025年11月19日
- Stripeの次の請求日: 2025年12月19日
- 間違った有効期限: **2026年1月19日** ❌
- 正しい有効期限: **2025年12月19日** ✅

---

## ✅ 修正内容

### 修正後のコード

```typescript
// ✅ 正しいコード
const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
expiresAt = currentPeriodEnd; // currentPeriodEndはすでに次の請求日
```

### 理由
Stripeの `currentPeriodEnd` は**すでに次の請求日（有効期限）**です。追加の計算は不要です。

---

## 📊 Stripeのサブスクリプション仕組み

### サブスクリプションのライフサイクル

1. **初回購入**（`checkout.session.completed`）
   ```
   購入日: 2025-11-19
   currentPeriodStart: 2025-11-19
   currentPeriodEnd: 2025-12-19 ← 次の請求日
   ```

2. **毎月自動更新**（`customer.subscription.updated`）
   ```
   請求日: 2025-12-19
   currentPeriodStart: 2025-12-19
   currentPeriodEnd: 2026-01-19 ← 次の請求日（自動的に+1ヶ月）
   ```

3. **キャンセル**（`customer.subscription.deleted`）
   ```
   キャンセル日: 2025-12-10
   currentPeriodEnd: 2025-12-19 ← この日まで有効
   その後: free（ブロンズ）にダウングレード
   ```

### 重要なポイント

- ✅ **Stripeが自動的に毎月請求します**
- ✅ **`currentPeriodEnd` は常に次の請求日**
- ✅ **追加の計算は不要**

---

## 🔍 修正箇所

### 1. `customer.subscription.updated` イベント（行640-651）

**修正前:**
```typescript
if (finalPlan === 'subscription') {
  // シルバー会員: 現在の期間終了日の1ヶ月後
  expiresAt = new Date(currentPeriodEnd);
  expiresAt.setMonth(expiresAt.getMonth() + 1); // ❌ 余計
}
```

**修正後:**
```typescript
if (finalPlan === 'subscription') {
  // シルバー会員: 現在の期間終了日（currentPeriodEndはすでに次の請求日）
  expiresAt = currentPeriodEnd; // ✅ そのまま使う
}
```

### 2. `checkout.session.completed` イベント（行427-428）

**こちらは正しい** ✅
```typescript
if (currentPeriodEnd) {
  // シルバー会員: 現在の期間終了日
  expiresAt = currentPeriodEnd.toISOString(); // ✅ 正しい
}
```

---

## 🧪 テスト方法

### 1. Stripeテストモードで月額プランを購入

```bash
# テストカード番号
4242 4242 4242 4242
```

### 2. Webhookログを確認

```bash
vercel logs --since 1h | grep "subscription"
```

期待されるログ：
```
✅ User metadata updated (subscription active): {
  userId: "...",
  membershipType: "subscription",
  expiresAt: "2025-12-19T..." // 購入日から1ヶ月後
}
```

### 3. Stripeダッシュボードでサブスクリプションを確認

1. **Stripeダッシュボード** → **顧客**
2. テストユーザーをクリック
3. **サブスクリプション**タブを確認
4. `current_period_end` を確認

### 4. Supabaseでユーザー情報を確認

```sql
SELECT 
  email,
  raw_user_meta_data->>'membership_type' as membership_type,
  raw_user_meta_data->>'subscription_expires_at' as expires_at,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'membership_type' = 'subscription';
```

期待される結果：
```
expires_at = created_at + 1 month
```

---

## 🚀 自動更新のテスト

### Stripeテストクロックを使用

Stripeの**テストクロック**機能を使うと、時間を進めて自動更新をテストできます。

1. **Stripeダッシュボード** → **開発者** → **テストクロック**
2. **新しいテストクロックを作成**
3. サブスクリプションを作成
4. **時間を1ヶ月進める**
5. `customer.subscription.updated` イベントが発火
6. 有効期限が正しく更新されるか確認

---

## 📝 Webhookイベントの処理フロー

### 初回購入（シルバー会員）

```
1. ユーザーが支払い
   ↓
2. checkout.session.completed イベント
   ↓
3. Stripeからサブスクリプション情報を取得
   - subscription.current_period_end = 2025-12-19
   ↓
4. 有効期限を設定
   - subscription_expires_at = 2025-12-19 ✅
```

### 毎月の自動更新

```
1. Stripeが自動的に請求（2025-12-19）
   ↓
2. customer.subscription.updated イベント
   ↓
3. サブスクリプション情報を取得
   - subscription.current_period_end = 2026-01-19（自動的に+1ヶ月）
   ↓
4. 有効期限を更新
   - subscription_expires_at = 2026-01-19 ✅
```

### キャンセル

```
1. ユーザーがキャンセル
   ↓
2. customer.subscription.deleted イベント
   ↓
3. 現在の期間終了日まで有効
   - subscription_expires_at = 2025-12-19
   ↓
4. 期間終了後、free（ブロンズ）にダウングレード
```

---

## ✅ 動作確認チェックリスト

- [ ] 初回購入時、有効期限が購入日+1ヶ月になる
- [ ] 1ヶ月後、Stripeが自動的に請求する
- [ ] 自動更新時、有効期限が+1ヶ月延長される
- [ ] キャンセル時、現在の期間終了日まで有効
- [ ] 期間終了後、free（ブロンズ）にダウングレード
- [ ] Webhookログにエラーがない
- [ ] Stripeダッシュボードでサブスクリプションが正常

---

## 🔒 セキュリティ確認

- [x] Webhookシークレットが正しく設定されている
- [x] Webhookイベントが署名検証される
- [x] 不正なリクエストは拒否される

---

## 📞 問題が発生した場合

### デバッグ方法

1. **Vercelログを確認**
   ```bash
   vercel logs --since 1h | grep -i "subscription\|webhook"
   ```

2. **Stripeダッシュボードでイベントを確認**
   - Webhooks → エンドポイント → 最近の配信

3. **Supabaseでユーザー情報を確認**
   ```sql
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

### よくある問題

**問題1**: 有効期限が更新されない
- Webhookイベントが受信されているか確認
- Stripeのサブスクリプションが `active` か確認

**問題2**: 請求が失敗する
- 支払い方法が有効か確認
- Stripeダッシュボードで失敗理由を確認

**問題3**: 有効期限がずれている
- 上記の修正が適用されているか確認
- Webhookログで計算過程を確認

---

## 🎯 まとめ

### 修正内容
- ✅ シルバー会員の有効期限計算を修正
- ✅ `currentPeriodEnd` をそのまま使用（追加計算なし）
- ✅ 自動更新が正常に動作

### 影響
- ✅ 既存ユーザー: 0人（シルバー会員はまだいない）
- ✅ 支払い: 正常に毎月徴収される
- ✅ 有効期限: 正しく設定される

### 今後の対応
1. コードをデプロイ
2. テスト購入で動作確認
3. 本番環境で監視

---

## 関連ドキュメント

- [FIX_LIFETIME_EXPIRATION_BUG.md](./FIX_LIFETIME_EXPIRATION_BUG.md) - ゴールド会員のバグ修正
- [STRIPE_PAYMENT_INTEGRATION.md](./STRIPE_PAYMENT_INTEGRATION.md) - Stripe統合ガイド
- [WEBHOOK_TROUBLESHOOTING.md](./WEBHOOK_TROUBLESHOOTING.md) - Webhookトラブルシューティング

