# Vercel環境変数設定ガイド

## お問い合わせフォーム用メール設定（TITANメール）

### 必要な環境変数

以下の環境変数をVercelのダッシュボードで設定してください：

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `TITAN_SMTP_PASS` | `Sakon-0201` | TITANメールのSMTPパスワード |
| `TITAN_SMTP_USER` | `info@lifesupporthk.com` | TITANメールのSMTPユーザー名（メールアドレス） |
| `CONTACT_TO` | `info@lifesupporthk.com` | お問い合わせフォームの送信先メールアドレス |

### 設定手順

1. Vercelダッシュボードにアクセス
   - https://vercel.com/dashboard
   - `slang-cantonese-app` プロジェクトを開く

2. **Settings** → **Environment Variables** に移動

3. 上記の3つの環境変数を追加
   - **Environment**: `Production`, `Preview`, `Development` すべてにチェック

4. 環境変数を追加後、再デプロイが必要です
   - 次のコミット/プッシュで自動的に再デプロイされます

### TITANメール SMTP設定

- **SMTPサーバー**: `smtp.titan.email`
- **ポート**: `465` (SSL/TLS)
- **暗号化**: SSL/TLS
- **認証**: ユーザー名とパスワードで認証

### コードでの使用箇所

- `app/api/contact/route.ts` - お問い合わせフォームのメール送信処理

### 注意事項

- 環境変数は機密情報のため、Gitリポジトリにはコミットしないでください
- Vercelの環境変数設定画面でのみ管理してください
- 本番環境、プレビュー環境、開発環境すべてに同じ値を設定することを推奨します

