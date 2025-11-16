# JS Bin プレビュー再利用ガイド

JS Bin 上でプランカードとカテゴリー解説を再表示・再編集するための手順をまとめています。  
同フォルダ内の `plan-cards.html` に最新の HTML/CSS 一式を保存しています。

## 手順

1. ブラウザで <https://jsbin.com> を開き、右上の **New** をクリックします。  
2. JS Bin の *HTML* ペインに `plan-cards.html` の内容をすべて貼り付けます。  
   - `plan-cards.html` はこのリポジトリ内の `docs/jsbin-preview/plan-cards.html` です。  
   - エディタから全文コピーするか、VS Code などで開いてコピーしてください。  
3. JS Bin 画面右上の **Save** を押すと URL が発行され、ブラウザで即座にプレビューできます。  
4. カード内容を変更したい場合は HTML 内のテキストを書き換え、CSS の調整も同ファイル内で行ってください。  
5. 完了したら **Export → Download as .zip** でローカルに保存するか、公開用 URL を控えておきます。

## ローカルでのプレビュー

JS Bin を使わずローカルで確認したい場合は、リポジトリ直下で以下のコマンドを実行します。

```
open docs/jsbin-preview/plan-cards.html
```

macOS では標準ブラウザでファイルが開き、JS Bin と同じ見た目を確認できます。

## 更新フローのメモ

- `plan-cards.html` を編集 → 保存  
- 必要に応じて JS Bin へコピー → プレビュー確認  
- Note 記事等に貼り付ける際は、`plan-card-grid` セクションと `plan-category-info` セクションを Markdown へ変換するなど、既定の手順に沿って統合してください。  
- 変更内容を共有したい場合は、このフォルダに追加の `CHANGELOG.md` などを作成して履歴を残すこともできます。


