# SMTP設定ガイド - メール送信元アドレスの変更

現在のメール送信元: `noreply@mail.app.supabase.io`（Supabaseデフォルト）
変更後の送信元: カスタムSMTPサーバーで設定したアドレス

## カスタムSMTPサーバーの設定方法

### 1. SMTPサービスを選択

以下のサービスから選択できます：

- **Resend** (推奨): https://resend.com/
- **AWS SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com/
- **SendGrid**: https://www.twilio.com/sendgrid
- **Brevo (旧Sendinblue)**: https://www.brevo.com/

### 2. SMTPサービスでアカウント作成と設定

例: Resendを使用する場合

1. Resendでアカウント作成: https://resend.com/signup
2. API Keysページで「Create API Key」をクリック
3. 「Add Domain」で送信ドメインを追加（例: `slang-cantonese.com`）
4. DNS設定を追加（Resendが指示を提供）
5. SMTP設定を取得:
   - Host: `smtp.resend.com`
   - Port: `587` または `465`
   - Username: `resend`
   - Password: API Key

### 3. Supabaseダッシュボードで設定

1. **Supabaseダッシュボード** → **Settings** → **Auth** に移動
2. **SMTP Settings** セクションで以下を入力:
   - **Enable Custom SMTP**: 有効化
   - **SMTP Host**: `smtp.resend.com` (選択したサービスによる)
   - **SMTP Port**: `587` または `465`
   - **SMTP User**: `resend` (選択したサービスによる)
   - **SMTP Password**: API Key
   - **Sender email**: `noreply@slang-cantonese.com` (あなたのドメイン)
   - **Sender name**: `スラング先生広東語プラットフォーム`

### 4. Management APIで設定（オプション）

Supabaseダッシュボードではなく、APIで設定する場合：

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/qdmvituurfevyibtzwsb/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_admin_email": "noreply@slang-cantonese.com",
    "smtp_host": "smtp.resend.com",
    "smtp_port": 587,
    "smtp_user": "resend",
    "smtp_pass": "YOUR_API_KEY",
    "smtp_sender_name": "スラング先生広東語プラットフォーム"
  }'
```

## 無料で始められるSMTPサービス

### Resend (推奨)
- 無料枠: 月3,000通まで
- 設定が簡単
- ドキュメント: https://resend.com/docs/send-with-supabase-smtp

### Brevo (旧Sendinblue)
- 無料枠: 日300通まで
- 設定: https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP

### SendGrid
- 無料枠: 日100通まで
- 設定: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp

## 注意事項

1. **ドメインの所有確認が必要**
   - カスタムSMTPを使用する場合、通常ドメインの所有確認（DNS設定）が必要です
   - これにより、スパムとして扱われにくくなります

2. **送信元アドレス**
   - `smtp_admin_email`: 送信元メールアドレス（例: `noreply@slang-cantonese.com`）
   - `smtp_sender_name`: 送信者名（メールクライアントに表示される）

3. **設定後の確認**
   - 設定後、パスワードリセットメールを送信して確認
   - メールの送信元が変更されていることを確認

## 現在の設定状況

Management APIで現在のSMTP設定を確認できます：

```bash
curl -X GET "https://api.supabase.com/v1/projects/qdmvituurfevyibtzwsb/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  | jq '.smtp_admin_email, .smtp_host, .smtp_sender_name'
```

現在の設定では、すべて `null` になっているため、SupabaseのデフォルトSMTPを使用しています。


