# Note記事連携機能

このアプリは、Noteの記事から広東語フレーズを抽出して、カテゴリーとして表示する機能を持っています。

## ワークフロー

1. **Note記事を作成・公開**
   - Noteで広東語フレーズの記事を作成
   - 形式: `**番号. 日本語**：中国語 / 粤拼 / カタカナ`

2. **マークダウンファイルからカテゴリーを生成**
   ```bash
   npx tsx scripts/sync-note-category.ts <markdown-file-path> <note-url>
   ```
   
   例:
   ```bash
   npx tsx scripts/sync-note-category.ts ../note-post-mcp/cantonese-100-phrases-new.md https://note.com/bestinksalesman/n/na050a2a8ccfc
   ```

3. **アプリで自動表示**
   - `data/note-categories.json`に追加されたカテゴリーが自動的にアプリに表示されます
   - カテゴリーバーにNote記事のボタンが表示され、クリックで単語がボタンとして表示されます
   - Note記事へのリンクアイコン（↗）をクリックすると、元のNote記事が開きます

## ファイル構造

- `lib/note-parser.ts`: Note記事のマークダウンから単語を抽出するパーサー
- `app/api/note/parse/route.ts`: Note記事をパースするAPIエンドポイント
- `data/note-categories.json`: Noteカテゴリーのデータファイル
- `scripts/sync-note-category.ts`: マークダウンからカテゴリーを生成するスクリプト

## マークダウンの形式

```markdown
**1. おはよう**：早晨 / zou2 san4 / ジォウ2・サン(ヌ)4
**2. こんにちは**：午安 / ng5 on1 / ン(グ)5・オン1
```

この形式で記述すると、自動的に抽出されます。

## 今後の拡張

- Note記事のURLから直接取得する機能（現在はマークダウンの直接提供が必要）
- 定期的な自動同期機能
- 複数のNote記事の管理

