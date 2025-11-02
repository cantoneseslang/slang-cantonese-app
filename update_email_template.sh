#!/bin/bash

# Supabase Management APIを使用してパスワードリセットメールテンプレートを日本語に更新
# 
# 使用方法:
# 1. SupabaseダッシュボードでAccess Tokenを取得: https://supabase.com/dashboard/account/tokens
# 2. プロジェクト参照IDを取得（URLから確認可能）
# 3. 以下の環境変数を設定:
#    export SUPABASE_ACCESS_TOKEN="your-access-token"
#    export PROJECT_REF="your-project-ref"  # 例: qdmvituurfevyibtzwsb

if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$PROJECT_REF" ]; then
    echo "エラー: SUPABASE_ACCESS_TOKEN と PROJECT_REF を設定してください"
    echo ""
    echo "設定方法:"
    echo "  export SUPABASE_ACCESS_TOKEN='your-access-token'"
    echo "  export PROJECT_REF='your-project-ref'"
    exit 1
fi

echo "パスワードリセットメールテンプレートを日本語に更新中..."

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_recovery": "パスワードをリセット",
    "mailer_templates_recovery_content": "<h2>パスワードをリセット</h2><p>以下のリンクをクリックして、ユーザーのパスワードをリセットしてください：</p><p><a href=\"{{ .ConfirmationURL }}\">パスワードをリセット</a></p>"
  }'

echo ""
echo "更新完了！"


