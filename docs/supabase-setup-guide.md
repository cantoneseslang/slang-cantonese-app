# Supabase セットアップガイド

## 必要なテーブル

このアプリケーションには以下のテーブルが必要です：

1. **`favorites`** - お気に入り機能用
2. **`users`** - 会員種別管理用（オプション、`favorites`のみでも動作します）

## セットアップ手順

### 1. Supabaseダッシュボードにアクセス

https://supabase.com/dashboard/project/qdmvituurfevyibtzwsb にアクセス

### 2. SQL Editorでテーブルを作成

左メニューの **SQL Editor** を開き、以下の順序でSQLを実行してください：

#### ステップ1: `users`テーブルの作成（オプション）

`docs/users-table.sql` の内容をコピーして実行

#### ステップ2: `favorites`テーブルの作成（必須）

`docs/favorites-table.sql` の内容をコピーして実行

### 3. テーブルの確認

**Table Editor** で以下のテーブルが作成されているか確認：
- ✅ `favorites` テーブル
- ✅ `users` テーブル（オプション）

### 4. RLSポリシーの確認

**Authentication** → **Policies** で以下のポリシーが設定されているか確認：

#### `favorites`テーブルのポリシー：
- ✅ `Users can view their own favorites` (SELECT)
- ✅ `Users can insert their own favorites` (INSERT)
- ✅ `Users can delete their own favorites` (DELETE)
- ✅ `Users can update their own favorites` (UPDATE)

#### `users`テーブルのポリシー（オプション）：
- ✅ `Users can view their own data` (SELECT)
- ✅ `Users can update their own data` (UPDATE)

## テーブル構造

### `favorites`テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| `id` | UUID | 主キー（自動生成） |
| `user_id` | UUID | ユーザーID（auth.users参照） |
| `category_id` | TEXT | カテゴリーID |
| `word_chinese` | TEXT | 広東語の単語 |
| `word_japanese` | TEXT | 日本語訳（オプション） |
| `created_at` | TIMESTAMP | 作成日時 |

**制約**:
- `(user_id, category_id, word_chinese)` の組み合わせは一意

### `users`テーブル（オプション）

| カラム名 | 型 | 説明 |
|---------|-----|------|
| `id` | UUID | 主キー（auth.users参照） |
| `email` | TEXT | メールアドレス |
| `membership_type` | TEXT | 会員種別（'free', 'subscription', 'lifetime'） |
| `created_at` | TIMESTAMP | 作成日時 |
| `updated_at` | TIMESTAMP | 更新日時 |

## トラブルシューティング

### エラー: "relation does not exist"

テーブルが作成されていません。SQL Editorでテーブル作成SQLを実行してください。

### エラー: "permission denied" または "new row violates row-level security policy"

RLSポリシーが設定されていません。SQL EditorでRLSポリシー作成SQLを実行してください。

### エラー: "duplicate key value violates unique constraint"

同じお気に入りが既に登録されています。これは正常な動作です。

