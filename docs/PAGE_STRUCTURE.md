# ページ構成と保護状態一覧

最終更新: 2025年11月6日

## ディレクトリツリー構造

```
app/
├── page.tsx                    # メインページ（ホーム）
├── login/
│   └── page.tsx               # ログインページ
├── about/
│   └── page.tsx               # アプリについて
├── cantonese/
│   └── page.tsx               # 広東語について
├── admin/
│   └── page.tsx               # 管理者ページ
├── contact/
│   └── page.tsx               # お問い合わせページ
├── faq/
│   └── page.tsx               # FAQページ
├── support/
│   └── page.tsx               # サポートページ
├── updates/
│   └── page.tsx               # 更新情報ページ
└── legal/
    ├── terms/
    │   └── page.tsx           # 利用規約ページ
    ├── privacy/
    │   └── page.tsx           # プライバシーポリシーページ
    └── tokusho/
        └── page.tsx           # 特定商取引法に基づく表示ページ
```

## ページファイルの状態一覧

### 🔴 保護対象（変更不可）

以下のファイルは保護されており、意図しない変更を防ぐ設定が有効です。

| ファイルパス | 保護設定 | Pre-commit Hook | バックアップ | 説明 |
|------------|---------|----------------|------------|------|
| `app/faq/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | FAQページ |
| `app/support/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | サポートページ |
| `app/updates/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | 更新情報ページ |
| `app/legal/terms/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | 利用規約ページ |
| `app/legal/privacy/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | プライバシーポリシーページ |
| `app/legal/tokusho/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | 特定商取引法に基づく表示 |
| `app/contact/page.tsx` | ✅ `merge=ours` | ✅ 有効 | ✅ あり | お問い合わせページ（info@lifesupporthk.com） |

### 🟡 部分的に保護（マージ保護のみ）

以下のファイルはマージ保護のみで、pre-commit hookの対象外です。

| ファイルパス | 保護設定 | Pre-commit Hook | バックアップ | 説明 |
|------------|---------|----------------|------------|------|
| `app/about/page.tsx` | ✅ `merge=ours` | ❌ なし | ❌ なし | アプリについてページ |
| `app/cantonese/page.tsx` | ✅ `merge=ours` | ❌ なし | ❌ なし | 広東語についてページ |
| `app/admin/page.tsx` | ✅ `merge=ours` | ❌ なし | ❌ なし | 管理者ページ |

### 🟢 保護なし（変更可能）

以下のファイルは保護設定がなく、自由に変更できます。

| ファイルパス | 保護設定 | Pre-commit Hook | バックアップ | 説明 |
|------------|---------|----------------|------------|------|
| `app/page.tsx` | ❌ なし | ❌ なし | ❌ なし | **メインページ（ホーム）** |
| `app/login/page.tsx` | ❌ なし | ❌ なし | ❌ なし | ログインページ |

## 保護設定の詳細

### 1. `.gitattributes` によるマージ保護

**対象ファイル:**
- 法的文書（terms, privacy, tokusho）
- 重要なページファイル（faq, support, updates, contact, about, cantonese, admin）
- **除外:** `app/page.tsx`（メインページ）

**効果:**
- マージ時に自動的に上書きされません
- ブランチをマージしても、保護されたファイルは現在のバージョンが保持されます

### 2. Pre-commit Hook による保護

**対象ファイル:**
- `app/faq/page.tsx`
- `app/support/page.tsx`
- `app/updates/page.tsx`
- `app/legal/terms/page.tsx`
- `app/legal/privacy/page.tsx`
- `app/legal/tokusho/page.tsx`
- `app/contact/page.tsx`

**効果:**
- コミット前にチェックされます
- 保護されたファイルが変更されようとすると、コミットが拒否されます
- エラーメッセージと復元方法が表示されます

**設定場所:**
- `.githooks/pre-commit`
- Git設定: `git config core.hooksPath .githooks`

### 3. バックアップファイル

**保存場所:**
- `backups/important-pages/`

**バックアップファイル一覧:**
- `faq-page.tsx.backup`
- `support-page.tsx.backup`
- `updates-page.tsx.backup`
- `terms-page.tsx.backup`
- `privacy-page.tsx.backup`
- `tokusho-page.tsx.backup`
- `contact-page.tsx.backup`（info@lifesupporthk.com 修正後）

**復元方法:**
```bash
cp backups/important-pages/faq-page.tsx.backup app/faq/page.tsx
cp backups/important-pages/support-page.tsx.backup app/support/page.tsx
cp backups/important-pages/updates-page.tsx.backup app/updates/page.tsx
cp backups/important-pages/terms-page.tsx.backup app/legal/terms/page.tsx
cp backups/important-pages/privacy-page.tsx.backup app/legal/privacy/page.tsx
cp backups/important-pages/tokusho-page.tsx.backup app/legal/tokusho/page.tsx
cp backups/important-pages/contact-page.tsx.backup app/contact/page.tsx
```

## API エンドポイント

```
app/api/
├── contact/
│   └── route.ts               # お問い合わせフォーム送信（TITANメール）
├── translate/
│   └── route.ts               # 日本語→広東語翻訳（DeepSeek API）
├── generate-speech/
│   └── route.ts               # 音声生成
├── track-button/
│   └── route.ts               # ボタンクリックトラッキング
├── favorites/
│   ├── add/
│   │   └── route.ts
│   ├── list/
│   │   └── route.ts
│   └── remove/
│       └── route.ts
├── admin/
│   ├── button-analytics/
│   │   └── route.ts
│   ├── users/
│   │   └── route.ts
│   └── update-user/
│       └── route.ts
└── ...
```

## 保護されたファイルを変更する場合

### 一時的に保護を解除する方法

1. **`--no-verify` フラグを使用（推奨されません）:**
   ```bash
   git commit --no-verify -m "重要な変更: [変更内容]"
   ```

2. **Pre-commit hookを一時的に無効化:**
   ```bash
   mv .githooks/pre-commit .githooks/pre-commit.disabled
   git add [変更したファイル]
   git commit -m "重要な変更: [変更内容]"
   mv .githooks/pre-commit.disabled .githooks/pre-commit
   ```

### 保護設定の確認

```bash
# 保護されたファイルの整合性をチェック
./scripts/verify-protected-files.sh

# Git hooksの設定を確認
git config core.hooksPath

# .gitattributesの設定を確認
cat .gitattributes
```

## 重要な注意事項

1. **メインページ（`app/page.tsx`）は保護対象外です**
   - メインページが変更されても、保護されたページには影響しません

2. **保護されたファイルは3層の保護があります**
   - `.gitattributes` によるマージ保護
   - Pre-commit hook によるコミット前チェック
   - バックアップファイルによる復元可能

3. **誤って変更した場合**
   - バックアップから復元できます
   - Pre-commit hookがエラーメッセージを表示します

4. **新しい環境でクローンした場合**
   ```bash
   git config core.hooksPath .githooks
   ./scripts/verify-protected-files.sh
   ```

## 環境変数・設定情報

### 必須環境変数（Vercel / ローカル環境）

#### Supabase 認証・データベース

| 環境変数名 | 説明 | 必須 | 設定場所 |
|----------|------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | ✅ 必須 | Vercel環境変数 / `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー（公開キー） | ✅ 必須 | Vercel環境変数 / `.env.local` |

**取得方法:**
1. Supabase Dashboard → プロジェクト設定 → API
2. `Project URL` を `NEXT_PUBLIC_SUPABASE_URL` に設定
3. `anon public` キーを `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定

**Supabase設定:**
- Redirect URLs（認証用）: 
  - Production: `https://slang-cantonese-app.vercel.app/auth/callback`
  - Local: `http://localhost:3001/auth/callback`

#### TITANメール（お問い合わせフォーム）

| 環境変数名 | 説明 | 必須 | デフォルト値 |
|----------|------|------|------------|
| `TITAN_SMTP_USER` | SMTPユーザー名（メールアドレス） | ✅ 必須 | `info@lifesupporthk.com` |
| `TITAN_SMTP_PASS` | SMTPパスワード | ✅ 必須 | （未設定） |
| `SMTP_HOST` | SMTPホスト | ⚠️ オプション | `smtp.titan.email` |
| `SMTP_PORT` | SMTPポート | ⚠️ オプション | `465` |
| `SMTP_FROM` | 送信元メールアドレス | ⚠️ オプション | `TITAN_SMTP_USER` の値 |
| `CONTACT_TO` | お問い合わせ先メールアドレス | ⚠️ オプション | `info@lifesupporthk.com` |

**TITANメール設定:**
- ホスト: `smtp.titan.email`
- ポート: `465` (SSL/TLS)
- セキュリティ: `secure: true` (SSL/TLS)
- 認証: 必要（ユーザー名 + パスワード）

**設定場所:**
- Vercel環境変数に設定
- ローカル開発の場合は `.env.local` に設定

**注意:** `TITAN_SMTP_PASS` は機密情報のため、Gitにコミットしないでください。

#### DeepSeek API（翻訳機能）

| 設定項目 | 値 | 説明 |
|---------|---|------|
| API Key | `sk-4762a303780f4233a5d1703c9b627a71` | DeepSeek APIキー（現在はハードコード） |
| API URL | `https://api.deepseek.com/v1/chat/completions` | DeepSeek APIエンドポイント |
| Model | `deepseek-chat` | 使用するモデル |
| Max Tokens | `500` | 最大トークン数 |
| Temperature | `0.3` | 温度パラメータ |

**注意:** 現在APIキーがハードコードされています。本番環境では環境変数化を推奨します。

**推奨環境変数化:**
```typescript
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-4762a303780f4233a5d1703c9b627a71';
```

### ローカル開発環境設定

#### ポート番号

- デフォルトポート: `3001`
- 設定: `package.json` の `dev` スクリプト
- ローカルリダイレクト: `NEXT_PUBLIC_LOCAL_REDIRECT=http://localhost:3001`

#### 環境変数ファイル

`.env.local` の例:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# TITANメール
TITAN_SMTP_USER=info@lifesupporthk.com
TITAN_SMTP_PASS=your-smtp-password
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
CONTACT_TO=info@lifesupporthk.com

# ローカル開発用
NEXT_PUBLIC_LOCAL_REDIRECT=http://localhost:3001
LOCAL_REDIRECT=http://localhost:3001
PORT=3001
NEXT_PUBLIC_PORT=3001
```

### 管理者設定

#### 管理者メールアドレス

**設定場所:** `middleware.ts`

```typescript
const adminEmails = ['bestinksalesman@gmail.com'];
```

**管理者権限の条件:**
1. メールアドレスが `adminEmails` 配列に含まれている
2. または、`user_metadata.is_admin === true`

**管理者がアクセス可能なページ:**
- `/admin` - 管理者ダッシュボード

### メールアドレス一覧

| 用途 | メールアドレス | 説明 |
|------|--------------|------|
| お問い合わせ先 | `info@lifesupporthk.com` | お問い合わせフォームの送信先 |
| 管理者 | `bestinksalesman@gmail.com` | 管理者アカウント |
| SMTP送信元 | `info@lifesupporthk.com` | TITANメールの送信元アドレス |

### API エンドポイント設定

#### 認証不要のエンドポイント

以下のエンドポイントは認証不要でアクセス可能です：

- `/api/contact` - お問い合わせフォーム（未ログインでも利用可能）
- `/api/auth/*` - 認証関連エンドポイント
- `/login` - ログインページ
- `/auth/*` - 認証コールバック

**設定場所:** `middleware.ts`

### データベース設定

#### Supabase テーブル

**主要テーブル:**
- `users` - ユーザー情報
- `favorites` - お気に入り機能
- （その他のテーブルは `docs/` ディレクトリを参照）

**設定ファイル:**
- `docs/users-table.sql` - ユーザーテーブル定義
- `docs/favorites-table.sql` - お気に入りテーブル定義

### セキュリティ設定

#### Git Hooks

- **設定場所:** `.githooks/pre-commit`
- **設定方法:** `git config core.hooksPath .githooks`
- **機能:** 保護されたファイルの変更を防止

#### ファイル保護

- **設定場所:** `.gitattributes`
- **保護方法:** `merge=ours` によるマージ保護

### Vercel デプロイ設定

#### 環境変数の設定方法

1. Vercel Dashboard → プロジェクト → Settings → Environment Variables
2. 以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
TITAN_SMTP_USER
TITAN_SMTP_PASS
SMTP_HOST (オプション)
SMTP_PORT (オプション)
CONTACT_TO (オプション)
```

#### ビルド設定

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### トラブルシューティング

#### 環境変数が読み込まれない場合

1. Vercel環境変数が正しく設定されているか確認
2. 環境変数名のタイポがないか確認
3. デプロイ後に環境変数が反映されているか確認（再デプロイが必要な場合あり）

#### メール送信が失敗する場合

1. `TITAN_SMTP_PASS` が正しく設定されているか確認
2. TITANメールのパスワードが期限切れでないか確認
3. ポート `465` が使用可能か確認
4. ファイアウォール設定を確認

#### Supabase認証が動作しない場合

1. Redirect URLs が正しく設定されているか確認
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
3. Supabaseプロジェクトがアクティブか確認

## 更新履歴

- 2025年11月6日: 保護設定を実装、バックアップを作成
- 2025年11月6日: contactページのメールアドレスを `info@lifesupporthk.com` に修正
- 2025年11月6日: `/api/contact` エンドポイントを復元（TITANメール設定）
- 2025年11月6日: 環境変数・設定情報をドキュメントに追加

