# 会員種別判定の重大なバグ修正

## 問題の概要

会員種別による制限機能が正しく動作していない問題が発見されました。特に、有料会員（シルバー・ゴールド）でも無料会員と同じ制限がかかってしまう重大なバグがありました。

## 発見された問題

### 1. `app/api/interpreter/check-quota/route.ts`の致命的なバグ

**問題箇所（16行目）:**
```typescript
const membershipType = user.user_metadata?.membershipType || 'free';
```

**問題点:**
- `membershipType`（キャメルケース）を参照しているが、実際のデータは`membership_type`（スネークケース）で保存されている
- これにより、有料会員でも常に`'free'`として判定され、制限がかかってしまう

**修正後:**
```typescript
const membershipType = user.user_metadata?.membership_type || 'free';
```

### 2. StripeとSupabaseの同期の問題

**問題点:**
- Stripe webhookでは`user_metadata`に`membership_type`を更新している
- しかし、`raw_user_meta_data`は更新されていない可能性がある
- 管理者ダッシュボードでは`raw_user_meta_data`から取得しているため、集計が正しくない

**確認結果:**
- データベースには`raw_user_meta_data`に`membership_type: 'lifetime'`が正しく保存されている
- しかし、Supabase Admin APIの`listUsers()`が返すオブジェクトの`user_metadata`にマッピングされていない可能性がある

### 3. 会員種別の判定ロジックの不統一

**問題点:**
- 一部のAPIでは`membershipType`（キャメルケース）を参照
- 他のAPIでは`membership_type`（スネークケース）を参照
- これにより、会員種別による制限が正しく動作していない可能性がある

## 修正内容

### 1. `app/api/interpreter/check-quota/route.ts`の修正

```typescript
// 修正前
const membershipType = user.user_metadata?.membershipType || 'free';

// 修正後
const membershipType = user.user_metadata?.membership_type || 'free';
```

### 2. `app/api/admin/users/route.ts`の修正

PostgreSQL関数`get_user_metadata()`を作成し、`raw_user_meta_data`から直接取得するように修正しました。

### 3. 会員種別の判定ロジックの統一

すべてのAPIで`membership_type`（スネークケース）を使用するように統一しました。

## 影響範囲

### 影響を受ける機能

1. **通訳機能の制限**
   - 有料会員でも100回の制限がかかっていた
   - 修正後、有料会員は無制限で使用可能

2. **OCR機能の制限**
   - 既に正しく実装されている（`membership_type`を使用）

3. **お気に入り機能の制限**
   - 既に正しく実装されている（`membership_type`を使用）

4. **管理者ダッシュボードの集計**
   - `raw_user_meta_data`から取得するように修正済み

## 確認が必要な項目

1. **Stripe webhookの動作確認**
   - `user_metadata`に`membership_type`が正しく更新されているか
   - `raw_user_meta_data`にも反映されているか

2. **会員種別による制限の動作確認**
   - 有料会員が正しく無制限で使用できるか
   - 無料会員が正しく制限されているか

3. **管理者ダッシュボードの集計確認**
   - ゴールド会員が正しく表示されるか
   - シルバー会員が正しく表示されるか

## 関連ファイル

- `app/api/interpreter/check-quota/route.ts`: 通訳機能の制限チェック（修正済み）
- `app/api/admin/users/route.ts`: 管理者ダッシュボードのユーザー情報取得（修正済み）
- `app/api/webhooks/stripe/route.ts`: Stripe webhook処理
- `app/api/ocr/check-quota/route.ts`: OCR機能の制限チェック（問題なし）
- `app/api/favorites/add/route.ts`: お気に入り機能の制限チェック（問題なし）

## 今後の改善点

1. **会員種別の判定ロジックの統一**
   - すべてのAPIで同じ方法で会員種別を取得する
   - ヘルパー関数を作成して統一する

2. **StripeとSupabaseの同期の改善**
   - `user_metadata`と`raw_user_meta_data`の両方を更新する
   - または、`user_metadata`から取得するように統一する

3. **テストの追加**
   - 会員種別による制限の動作をテストする
   - Stripe webhookの動作をテストする

