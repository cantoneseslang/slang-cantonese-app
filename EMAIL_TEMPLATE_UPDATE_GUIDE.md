# メールテンプレート日本語化ガイド

パスワードリセットメールテンプレートを日本語に変更する方法

## 方法1: Supabaseダッシュボードで直接変更（推奨）

### 手順

1. **Supabaseダッシュボードにログイン**
   - https://supabase.com/dashboard にアクセス

2. **プロジェクトを選択**
   - 該当のプロジェクトを選択

3. **Authentication → Email Templates に移動**
   - 左メニューから「Authentication」をクリック
   - 「Email Templates」タブをクリック

4. **Reset Password テンプレートを選択**

5. **件名を変更**
   - Subject欄に以下を入力:
   ```
   パスワードをリセット
   ```

6. **本文を変更**
   - Body欄に以下をコピー＆ペースト:
   ```html
   <h2>パスワードをリセット</h2>
   <p>以下のリンクをクリックして、ユーザーのパスワードをリセットしてください：</p>
   <p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
   ```

7. **保存**
   - 「Save」ボタンをクリック
   - 変更が保存されたことを確認

8. **キャッシュをクリア**
   - ブラウザのキャッシュをクリアするか、別のブラウザでテスト

### 重要な注意事項

- **`{{ .ConfirmationURL }}`** は絶対に削除しないでください
- HTMLタグは使用可能です
- 変更後、すぐに反映されない場合は数分待ってから再度テストしてください

## 方法2: Management APIを使用（プログラム的に更新）

ダッシュボードでの変更が反映されない場合、Management APIを使用して更新できます。

### 手順

1. **Access Tokenを取得**
   - https://supabase.com/dashboard/account/tokens にアクセス
   - 「Generate new token」をクリック
   - トークン名を入力して生成
   - トークンをコピー（表示されるのは一度だけなので注意）

2. **プロジェクト参照IDを確認**
   - プロジェクトURLから確認: `https://supabase.com/dashboard/project/プロジェクト参照ID`
   - または、`.env.local` の `NEXT_PUBLIC_SUPABASE_URL` から:
     - `https://qdmvituurfevyibtzwsb.supabase.co` → `qdmvituurfevyibtzwsb`

3. **スクリプトを実行**

```bash
# 環境変数を設定
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="qdmvituurfevyibtzwsb"

# スクリプトを実行
cd /Users/sakonhiroki/slang-cantonese-app
./update_email_template.sh
```

または、直接curlコマンドを実行:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/qdmvituurfevyibtzwsb/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_recovery": "パスワードをリセット",
    "mailer_templates_recovery_content": "<h2>パスワードをリセット</h2><p>以下のリンクをクリックして、ユーザーのパスワードをリセットしてください：</p><p><a href=\"{{ .ConfirmationURL }}\">パスワードをリセット</a></p>"
  }'
```

### 応答の確認

成功した場合、以下のようなJSONが返されます:
```json
{
  "mailer_subjects_recovery": "パスワードをリセット",
  ...
}
```

## テスト方法

1. パスワードリセット機能を使用
2. メールを確認
3. メールが日本語で表示されていることを確認

## トラブルシューティング

### 変更が反映されない場合

1. **ブラウザキャッシュをクリア**
2. **数分待ってから再度テスト**（Supabase側の反映に時間がかかる場合があります）
3. **Management APIを使用して確認**
   ```bash
   curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     | jq '.mailer_subjects_recovery, .mailer_templates_recovery_content'
   ```

### メールが届かない場合

1. **スパムフォルダを確認**
2. **SupabaseダッシュボードのLogsを確認**
3. **カスタムSMTPの設定を確認**



