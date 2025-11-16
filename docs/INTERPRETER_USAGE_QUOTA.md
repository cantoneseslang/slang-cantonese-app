# 通訳機能使用回数制限の実装

## 概要
カントン語通訳・中国語通訳の使用回数をカウントし、無料プランには100回の制限を適用しました。

## 実装内容

### 1. データベース
- **テーブル**: `interpreter_usage`
- **カラム**:
  - `id`: UUID (主キー)
  - `user_id`: UUID (ユーザーID)
  - `language`: TEXT ('cantonese' または 'mandarin')
  - `created_at`: TIMESTAMP (使用日時)

### 2. API

#### `/api/interpreter/check-quota` (POST)
使用可能回数をチェックするAPI

**レスポンス例（無料会員）**:
```json
{
  "allowed": true,
  "usageCount": 45,
  "limit": 100,
  "membershipType": "free"
}
```

**レスポンス例（有料会員）**:
```json
{
  "allowed": true,
  "usageCount": 0,
  "limit": -1,
  "membershipType": "subscription"
}
```

#### `/api/interpreter/track-usage` (POST)
通訳使用回数を記録するAPI

**リクエストボディ**:
```json
{
  "language": "cantonese" // または "mandarin"
}
```

### 3. 制限ルール

| メンバーシップ | 制限 |
|--------------|------|
| free | 100回/アカウント |
| subscription | 無制限 |
| lifetime | 無制限 |

### 4. UI表示

**表示位置**: 隠しモード（通訳モード）の「カントン語通訳」「中国語通訳」タイトルの上

**表示内容**:
- 無料会員: `通訳可能回数：45 / 100回`
- 有料会員: `通訳可能回数：無制限`
- 制限超過: 赤色で表示

### 5. 制限超過時の処理

制限に達した場合:
1. マイクボタンを押しても通訳が開始されない
2. アラートメッセージを表示
3. プランアップグレード画面（料金モーダル）を自動表示

```typescript
if (membershipType === 'free' && interpreterUsageCount >= interpreterUsageLimit) {
  alert('無料プランの通訳利用回数（100回）に達しました。\n引き続きご利用の場合はプランをアップグレードしてください。');
  setShowPricingModal(true);
  return;
}
```

## セットアップ手順

### 1. データベーステーブルの作成

Supabaseダッシュボードで以下のSQLを実行:

```bash
# docs/interpreter-usage-table.sql の内容を実行
```

### 2. 環境変数の確認

既存の環境変数が設定されていることを確認:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. テスト方法

1. 無料アカウントでログイン
2. カントン語通訳または中国語通訳を起動
3. 使用回数表示が表示されることを確認
4. 通訳を使用するたびに回数がインクリメントされることを確認
5. 100回に達したら制限メッセージが表示されることを確認

## ファイル構成

```
app/
├── api/
│   └── interpreter/
│       ├── check-quota/
│       │   └── route.ts          # 使用回数チェックAPI
│       └── track-usage/
│           └── route.ts          # 使用回数記録API
├── page.tsx                      # メインページ（制限チェック実装）
components/
└── interpreter/
    └── HiddenModeOverlay.tsx     # 通訳モードUI（使用回数表示）
docs/
├── interpreter-usage-table.sql   # テーブル作成SQL
└── INTERPRETER_USAGE_QUOTA.md    # このドキュメント
```

## トラブルシューティング

### 使用回数が表示されない
1. ログインしているか確認
2. ブラウザのコンソールでエラーを確認
3. `/api/interpreter/check-quota` がエラーを返していないか確認

### 使用回数がカウントされない
1. `/api/interpreter/track-usage` が正常に動作しているか確認
2. データベースの `interpreter_usage` テーブルにレコードが追加されているか確認

### 有料会員なのに制限がかかる
1. `membershipType` が正しく設定されているか確認（Supabase Auth のメタデータ）
2. ユーザーメタデータに `membershipType: 'subscription'` または `'lifetime'` が設定されているか確認

## 今後の拡張可能性

- 月ごとのリセット機能
- プランごとの異なる制限数
- 使用統計のダッシュボード
- 通訳時間による制限（回数ではなく分数）

