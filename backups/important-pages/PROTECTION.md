# 重要なページファイルの保護設定

## 保護の仕組み

これらの重要なページファイルは、以下の3層の保護によって守られています：

### 1. `.gitattributes` によるマージ保護
- `merge=ours` 設定により、マージ時に自動的に上書きされません
- メインページ（`app/page.tsx`）が変更されても、これらのファイルは影響を受けません

### 2. Git Pre-commit Hook による保護
- `.githooks/pre-commit` がコミット前にチェックします
- 保護されたファイルが変更されようとすると、コミットが拒否されます

### 3. バックアップファイル
- `backups/important-pages/` にバックアップが保存されています
- 誤って変更された場合、バックアップから復元できます

## 保護対象ファイル

以下のファイルは自動的に保護されています：

1. `app/faq/page.tsx`
2. `app/support/page.tsx`
3. `app/updates/page.tsx`
4. `app/legal/terms/page.tsx`
5. `app/legal/privacy/page.tsx`
6. `app/legal/tokusho/page.tsx`
7. `app/contact/page.tsx`

## 保護設定の確認

保護設定が正しく機能しているか確認するには：

```bash
# 保護されたファイルの整合性をチェック
./scripts/verify-protected-files.sh
```

## 保護されたファイルを変更する場合

**⚠️ 警告: 保護されたファイルを変更する場合は、必ず慎重に判断してください。**

### 一時的に保護を解除する方法

1. 変更をコミットする前に、`--no-verify` フラグを使用：
   ```bash
   git commit --no-verify -m "重要な変更: [変更内容]"
   ```

2. または、pre-commit hookを一時的に無効化：
   ```bash
   # hookを一時的にリネーム
   mv .githooks/pre-commit .githooks/pre-commit.disabled
   # 変更とコミット
   git add [変更したファイル]
   git commit -m "重要な変更: [変更内容]"
   # hookを元に戻す
   mv .githooks/pre-commit.disabled .githooks/pre-commit
   ```

## 誤って変更された場合の復元方法

バックアップから復元：

```bash
# 個別に復元
cp backups/important-pages/faq-page.tsx.backup app/faq/page.tsx
cp backups/important-pages/support-page.tsx.backup app/support/page.tsx
cp backups/important-pages/updates-page.tsx.backup app/updates/page.tsx
cp backups/important-pages/terms-page.tsx.backup app/legal/terms/page.tsx
cp backups/important-pages/privacy-page.tsx.backup app/legal/privacy/page.tsx
cp backups/important-pages/tokusho-page.tsx.backup app/legal/tokusho/page.tsx
cp backups/important-pages/contact-page.tsx.backup app/contact/page.tsx

# または、すべてを一度に復元
for file in backups/important-pages/*.backup; do
  filename=$(basename "$file" .backup)
  cp "$file" "app/${filename/-page/-/page}"
done
```

## 新しい保護設定を適用する方法

このリポジトリをクローンした後、保護設定を有効にするには：

```bash
# Git hooksのパスを設定
git config core.hooksPath .githooks

# 保護設定を確認
./scripts/verify-protected-files.sh
```

## 注意事項

- これらの保護設定は、意図しない変更を防ぐためのものです
- 重要な変更が必要な場合は、必ず慎重に検討してください
- バックアップファイルは定期的に更新することを推奨します
- メインページ（`app/page.tsx`）は保護対象外です







