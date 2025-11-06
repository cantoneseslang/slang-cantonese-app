# 重要なページファイルのバックアップ

このディレクトリには、重要なページファイルのバックアップが保存されています。

## バックアップ日時
- 2025年11月6日（contactページ修正後）
- 2025年11月6日 15:40（同時通訳モード実装完了時点）

## バックアップ対象ファイル

1. `faq-page.tsx.backup` - FAQページ
2. `support-page.tsx.backup` - サポートページ
3. `updates-page.tsx.backup` - 更新情報ページ
4. `terms-page.tsx.backup` - 利用規約ページ
5. `privacy-page.tsx.backup` - プライバシーポリシーページ
6. `tokusho-page.tsx.backup` - 特定商取引法に基づく表示ページ
7. `contact-page.tsx.backup` - お問い合わせページ（info@lifesupporthk.com 修正後）
8. `page-simultaneous-interpretation-20251106-154000.tsx.backup` - メインページ（同時通訳モード実装完了時点）

## 復元方法

これらのファイルが誤って変更された場合、以下のコマンドで復元できます：

```bash
# FAQページを復元
cp backups/important-pages/faq-page.tsx.backup app/faq/page.tsx

# サポートページを復元
cp backups/important-pages/support-page.tsx.backup app/support/page.tsx

# 更新情報ページを復元
cp backups/important-pages/updates-page.tsx.backup app/updates/page.tsx

# 利用規約ページを復元
cp backups/important-pages/terms-page.tsx.backup app/legal/terms/page.tsx

# プライバシーポリシーページを復元
cp backups/important-pages/privacy-page.tsx.backup app/legal/privacy/page.tsx

# 特定商取引法に基づく表示ページを復元
cp backups/important-pages/tokusho-page.tsx.backup app/legal/tokusho/page.tsx

# お問い合わせページを復元
cp backups/important-pages/contact-page.tsx.backup app/contact/page.tsx

# メインページ（同時通訳モード実装完了時点）を復元
cp backups/important-pages/page-simultaneous-interpretation-20251106-154000.tsx.backup app/page.tsx
```

## 注意事項

- これらのファイルは意図しない変更を防ぐためのバックアップです
- 変更が必要な場合は、必ず元のファイルと比較してから変更してください
- バックアップファイルは定期的に更新することを推奨します

