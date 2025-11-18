# 管理者ダッシュボードの会員種別集計問題の修正

## 問題の概要

管理者ダッシュボードの統計情報で、ゴールド会員が2名いるはずなのに0と表示される問題が発生していました。

## 問題の詳細

### 症状
- **データベース**: ゴールド会員（`membership_type = 'lifetime'`）が2名存在
  - `bestinksalesman@gmail.com`
  - `m.sakonhk@gmail.com`
- **フロントエンド表示**: ゴールド会員が0名と表示される
- **影響**: 統計情報が正確に表示されない

### 技術的な原因

1. **Supabaseのメタデータ構造**
   - Supabaseの`auth.users`テーブルには`raw_user_meta_data`と`user_metadata`の2つのメタデータフィールドがある
   - `raw_user_meta_data`: 読み取り専用、実際のデータベースに保存されている値
   - `user_metadata`: 書き込み可能、更新時に使用される値

2. **APIの実装問題**
   - `app/api/admin/users/route.ts`では、`u.user_metadata?.membership_type`のみを参照していた
   - 実際のデータベースには`raw_user_meta_data`に`membership_type: 'lifetime'`が保存されている
   - Supabase JS SDKの`listUsers()`が返すオブジェクトでは、`user_metadata`に`raw_user_meta_data`の内容がマッピングされていない可能性がある

3. **データの不整合**
   - データベースには正しく`raw_user_meta_data`に`membership_type: 'lifetime'`が保存されている
   - しかし、APIが`user_metadata`のみを参照していたため、正しく取得できていなかった

## 解決方法

### 修正内容

`app/api/admin/users/route.ts`を修正し、`raw_user_meta_data`と`user_metadata`の両方を確認するように変更しました。

#### 修正前
```typescript
membership_type: u.user_metadata?.membership_type || 'free',
```

#### 修正後
```typescript
// raw_user_meta_dataを優先し、なければuser_metadataを使用
const rawMeta = u.raw_user_meta_data || {};
const userMeta = u.user_metadata || {};

membership_type: rawMeta.membership_type || userMeta.membership_type || 'free',
```

### 実装の詳細

1. **両方のメタデータを確認**
   - `raw_user_meta_data`を優先的に使用
   - `raw_user_meta_data`に値がない場合のみ`user_metadata`を使用
   - どちらにも値がない場合は`'free'`をデフォルト値として使用

2. **デバッグログの追加**
   - ゴールド会員が検出された場合、ログに出力
   - `raw_user_meta_data`と`user_metadata`の両方の値を確認可能

3. **全フィールドへの適用**
   - `membership_type`だけでなく、他のメタデータフィールド（`username`, `subscription_expires_at`, `survey_*`など）にも同じロジックを適用

## データベースの確認結果

### 実際のデータ
```sql
-- ゴールド会員の確認
SELECT 
  id,
  email,
  raw_user_meta_data->>'membership_type' as membership_type
FROM auth.users
WHERE raw_user_meta_data->>'membership_type' = 'lifetime';
```

結果:
- `bestinksalesman@gmail.com`: `membership_type = 'lifetime'`
- `m.sakonhk@gmail.com`: `membership_type = 'lifetime'`

### 会員種別の集計
```sql
SELECT 
  COALESCE(raw_user_meta_data->>'membership_type', 'free') as membership_type,
  COUNT(*) as count
FROM auth.users
GROUP BY COALESCE(raw_user_meta_data->>'membership_type', 'free');
```

結果:
- `free`: 53名
- `lifetime`: 2名
- 合計: 55名

## 今後の改善点

1. **メタデータの同期**
   - `raw_user_meta_data`と`user_metadata`の不整合を防ぐため、更新時に両方を同期する

2. **データ整合性チェック**
   - 定期的にデータベースのメタデータを確認し、不整合がないかチェック

3. **エラーハンドリング**
   - メタデータが取得できない場合のエラーハンドリングを強化

## 関連ファイル

- `app/api/admin/users/route.ts`: ユーザー情報取得API（修正済み）
- `app/admin/page.tsx`: 管理者ダッシュボード（フロントエンド）
- `app/api/admin/update-user/route.ts`: ユーザー情報更新API

## 参考資料

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-listusers)
- [Supabase User Metadata](https://supabase.com/docs/guides/auth/users/user-metadata)

