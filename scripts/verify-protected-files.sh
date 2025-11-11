#!/bin/bash

# 保護対象の重要なページファイル
PROTECTED_FILES=(
  "app/faq/page.tsx"
  "app/support/page.tsx"
  "app/updates/page.tsx"
  "app/legal/terms/page.tsx"
  "app/legal/privacy/page.tsx"
  "app/legal/tokusho/page.tsx"
  "app/contact/page.tsx"
)

BACKUP_DIR="backups/important-pages"

echo "🔍 保護されたファイルの整合性をチェック中..."
echo ""

ALL_OK=true

for file in "${PROTECTED_FILES[@]}"; do
  backup_file="$BACKUP_DIR/$(basename $file).backup"
  
  if [ ! -f "$file" ]; then
    echo "❌ エラー: $file が存在しません"
    echo "   バックアップから復元してください: cp $backup_file $file"
    ALL_OK=false
  elif [ -f "$backup_file" ]; then
    if ! diff -q "$file" "$backup_file" > /dev/null 2>&1; then
      echo "⚠️  警告: $file がバックアップと異なります"
      echo "   バックアップから復元する場合は: cp $backup_file $file"
    else
      echo "✅ $file は正常です"
    fi
  else
    echo "⚠️  警告: $backup_file が見つかりません"
  fi
done

echo ""
if [ "$ALL_OK" = true ]; then
  echo "✅ すべての保護されたファイルが存在します"
  exit 0
else
  echo "❌ 一部のファイルに問題があります。上記を確認してください。"
  exit 1
fi









