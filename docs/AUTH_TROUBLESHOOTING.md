# 認証トラブルシューティング

## 現状の問題

### 2025-11-19 時点の分析結果

#### ✅ 正常に動作している部分
- Google OAuth認証は完全に動作しています
- 認証ログにエラーは検出されていません
- 既存のログインユーザーは問題なくアクセスできています

#### ⚠️ メール認証未完了のユーザー（7名）

以下のユーザーが確認メールを完了しておらず、ログインできない状態です:

1. `sao611912@yahoo.co.jp` (2025-11-18 23:09:08 UTC)
2. `iannai.0309@gmail.com` (2025-11-18 14:49:33 UTC)
3. `usakodayon@gmail.com` (2025-11-18 11:44:09 UTC)
4. `adklhafdf555@gmail.com` (2025-11-17 17:02:56 UTC)
5. `tomoko.katsuoka@gmail.com` (2025-11-17 13:35:04 UTC)
6. `fukumiosmile@icloud.com` (2025-11-17 09:52:06 UTC)
7. `mcdas9981@gmail.com` (2025-11-17 09:44:39 UTC)

**状態**: 
- `confirmed_at`: NULL
- `email_confirmed_at`: NULL
- `last_sign_in_at`: NULL
- `provider`: "email"

---

## ユーザー向けトラブルシューティングガイド

### 「ログインできない」と報告があった場合

#### 1. Google認証を使用している場合

**症状**: Googleでログインしようとしても入れない

**確認事項**:
- ブラウザのCookieが有効になっているか
- プライベートブラウジング/シークレットモードを使用していないか
- ブラウザの拡張機能（広告ブロッカーなど）が干渉していないか

**対処方法**:
```
1. ブラウザのCookieとキャッシュをクリア
2. ブラウザを再起動
3. 別のブラウザで試す
4. プライベートブラウジングモードを無効にする
```

#### 2. メールとパスワードで登録した場合

**症状**: メールとパスワードでログインできない

**確認事項**:
- 登録時に送信された確認メールを受信したか
- 確認メールのリンクをクリックしたか
- スパムフォルダに確認メールが入っていないか

**対処方法**:
```
1. メールの受信トレイとスパムフォルダを確認
2. 確認メールのリンクをクリック
3. 確認メールが見つからない場合は、再送信を依頼
```

#### 3. 確認メールが届かない場合

**確認メールの再送信手順**:
1. ログインページにアクセス
2. 「確認メールを再送信」オプションを探す（実装されている場合）
3. それでも届かない場合は、サポートに連絡

---

## 管理者向けトラブルシューティング

### メール確認を手動で完了させる方法

Supabaseダッシュボードで以下のSQLを実行:

```sql
-- 特定のユーザーのメール確認を手動で完了
UPDATE auth.users
SET 
  confirmed_at = NOW(),
  email_confirmed_at = NOW()
WHERE email = 'ユーザーのメールアドレス';
```

### 認証ログの確認方法

```sql
-- 最近のログイン試行を確認
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- メール未確認のユーザーを確認
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider
FROM auth.users
WHERE confirmed_at IS NULL
ORDER BY created_at DESC;
```

---

## セキュリティ警告

### ⚠️ 検出された問題

**関数**: `public.get_user_metadata`
**問題**: `search_path`パラメータが設定されていない
**リスク**: 関数のsearch_pathが変更可能でセキュリティリスクがあります
**詳細**: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

**修正方法**:
```sql
ALTER FUNCTION public.get_user_metadata(uuid)
SET search_path = public, pg_temp;
```

---

## ユーザーから問い合わせがあった場合の対応フロー

### ステップ1: 認証方法の確認
```
Q: どの方法でログインしようとしていますか？
A: [ ] Google認証
   [ ] メールとパスワード
```

### ステップ2: Google認証の場合
```
1. ブラウザのCookieが有効か確認してもらう
2. キャッシュクリアを試してもらう
3. 別のブラウザで試してもらう
4. それでも解決しない場合は、以下を確認:
   - SupabaseのAuth Logsでエラーを確認
   - Middlewareの動作を確認
```

### ステップ3: メール認証の場合
```
1. 確認メールを受信したか確認
2. 確認メールのリンクをクリックしたか確認
3. スパムフォルダも確認してもらう
4. 確認メールが見つからない場合:
   - 管理者が手動でメール確認を完了させる
   - または、確認メールを再送信
```

### ステップ4: データベース確認
```sql
-- ユーザーの認証状態を確認
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  confirmed_at,
  email_confirmed_at,
  raw_app_meta_data->>'provider' as provider
FROM auth.users
WHERE email = 'ユーザーのメールアドレス';
```

---

## 緊急対応が必要な場合

### シナリオ: 多数のユーザーがログインできない

**即座に確認すべき項目**:
1. Supabase Authサービスの稼働状況
2. Vercelのデプロイ状況
3. Middlewareの認証チェックが動作しているか
4. 環境変数（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）が正しく設定されているか

**一時的な対処**:
```typescript
// middleware.ts で認証チェックを一時的に無効化（緊急時のみ）
if (process.env.EMERGENCY_BYPASS === 'true') {
  return supabaseResponse;
}
```

---

## 予防策

### 1. メール認証フローの改善
- 確認メールが届かない場合の再送信機能を実装
- 確認メールのスパム対策（SPF、DKIMの設定）

### 2. ユーザーへの案内改善
- 「確認メールを送信しました」のメッセージを表示
- スパムフォルダも確認するよう案内

### 3. モニタリング
- 未確認メールのユーザーを定期的に確認
- 認証エラーのアラート設定

---

## 関連ドキュメント
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [GOOGLE_OAUTH_TROUBLESHOOTING.md](./GOOGLE_OAUTH_TROUBLESHOOTING.md)
- [LOGIN_REDIRECT_ISSUE.md](./LOGIN_REDIRECT_ISSUE.md)


