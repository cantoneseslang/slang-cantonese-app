ak# 決済フローの問題点と修正方針

## 現在の問題点

### 1. 既存サブスクリプションがある場合の処理が不適切
- **問題**: 既存サブスクリプションがある場合、新しいCheckout Sessionを作成している
- **結果**: 2つのサブスクリプションが存在する可能性がある
- **正しい処理**: 既存サブスクリプションを更新し、比例配分で請求する

### 2. 決済フローが複雑すぎる
- **問題**: 複数の場所で会員種別を更新している
  - `payment_intent.succeeded` → 会員種別更新
  - `checkout.session.completed` → 会員種別更新
  - `customer.subscription.updated` → 会員種別更新
  - `verify-session` → 会員種別更新
- **結果**: 競合や重複更新の可能性がある

### 3. 既存サブスクリプションの更新処理が不適切
- **問題**: プラン変更時に新しいCheckout Sessionを作成している
- **結果**: 決済が二重に発生する可能性がある
- **正しい処理**: `stripe.subscriptions.update()`を使用して既存サブスクリプションを更新

## 修正方針

### 1. 既存サブスクリプションがある場合の処理
- **同じプラン**: `alreadyActive: true`を返す（現在の実装は正しい）
- **異なるプラン**: 
  - `stripe.subscriptions.update()`を使用して既存サブスクリプションを更新
  - `proration_behavior: 'always_invoice'`で比例配分で請求
  - 決済はStripeが自動的に処理（デフォルトの支払い方法を使用）
  - Webhookで会員種別を更新

### 2. 決済フローの簡素化
- **新規サブスクリプション**: Checkout Sessionを作成 → Webhookで会員種別更新
- **既存サブスクリプション更新**: `subscriptions.update()` → Webhookで会員種別更新
- **verify-session**: Webhookの補完として使用（Webhookが遅延した場合）

### 3. Webhook処理の整理
- `checkout.session.completed`: 新規サブスクリプションの場合のみ処理
- `customer.subscription.updated`: 既存サブスクリプション更新の場合のみ処理
- `payment_intent.succeeded`: lifetimeプランの場合のみ処理（必要に応じて）

## 実装手順

1. `create-checkout-session`を修正
   - 既存サブスクリプションがある場合、`subscriptions.update()`を使用
   - 新規サブスクリプションの場合のみ、Checkout Sessionを作成

2. Webhook処理を整理
   - 各イベントの役割を明確化
   - 重複更新を防止

3. テスト
   - 新規サブスクリプション作成
   - 既存サブスクリプションのプラン変更
   - 同じプランへの再購入

