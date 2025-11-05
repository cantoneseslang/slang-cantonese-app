# Noteカテゴリーのお気に入り登録・表示問題の解決策

## 問題の概要

note100選（`note_na050a2a8ccfc`など）の単語を長押しでお気に入り登録しても、お気に入り画面（⭐️ お気に入り）に表示されない問題が発生していました。

## 確認結果

### データベース側の確認
- ✅ Supabaseの`user_favorites`テーブルには正しくデータが保存されている
- ✅ `category_id`は`note_na050a2a8ccfc`として正しく保存されている
- ✅ API（`/api/favorites/add`）は正常に動作し、データを保存している

### 問題の症状
- 長押しでお気に入り登録すると、星マークは塗りつぶされる
- しかし、お気に入り画面に切り替えても、Noteカテゴリーの単語が表示されない
- 通常カテゴリーのお気に入りは正常に表示される

## 原因

`app/page.tsx`の`useEffect`内で、お気に入り画面での単語検索ロジックに問題がありました。

### 問題のコード（修正前）

```typescript
favorites.forEach((favoriteKey) => {
  const [categoryId, wordChinese] = favoriteKey.split(':');
  const category = categories.find(c => c.id === categoryId); // ❌ 通常カテゴリーからしか検索していない
  if (category && category.words) {
    const word = category.words.find(w => w.chinese === wordChinese);
    // ...
  }
});
```

**問題点:**
- `categories`（通常カテゴリー）からしか単語を検索していなかった
- `noteCategoriesData`（Noteカテゴリー）からは検索していなかった
- そのため、`category_id`が`note_na050a2a8ccfc`のようなNoteカテゴリーIDの場合、`categories`には存在しないため、単語が見つからず表示されなかった

## 解決策

お気に入り画面での単語検索ロジックを修正し、通常カテゴリーから見つからない場合はNoteカテゴリーからも検索するようにしました。

### 修正後のコード

```typescript
favorites.forEach((favoriteKey) => {
  const [categoryId, wordChinese] = favoriteKey.split(':');
  
  // まず通常のカテゴリーから検索
  let category = categories.find(c => c.id === categoryId);
  let word: Word | undefined;
  
  if (category) {
    // 通常カテゴリーから単語を検索
    if (category.words) {
      word = category.words.find(w => w.chinese === wordChinese);
    }
    // practiceGroupsからも検索
    if (!word && category.practiceGroups) {
      category.practiceGroups.forEach(group => {
        const foundWord = group.words.find(w => w.chinese === wordChinese);
        if (foundWord) {
          word = foundWord;
        }
      });
    }
  } else {
    // 通常カテゴリーに見つからない場合、Noteカテゴリーから検索
    const noteCategory = (noteCategoriesData as Category[]).find(c => c.id === categoryId);
    if (noteCategory && noteCategory.words) {
      word = noteCategory.words.find(w => w.chinese === wordChinese);
      category = noteCategory; // Noteカテゴリーを設定
    }
  }
  
  // 単語が見つかった場合は追加
  if (word && !favoriteWords.find(w => w.chinese === wordChinese)) {
    favoriteWords.push({ ...word, chinese: word.chinese });
    categoryMap.set(word.chinese, categoryId); // 元のcategoryIdを保存
  }
});
```

### 修正のポイント

1. **2段階検索**: まず通常カテゴリーから検索し、見つからない場合はNoteカテゴリーから検索
2. **Noteカテゴリーのインポート**: `noteCategoriesData`を正しくインポートして使用
3. **カテゴリーマップの保存**: お気に入り削除時に正しい`categoryId`を使用できるように、`favoriteWordCategoryMapRef`に元の`categoryId`を保存

## 関連ファイル

- `app/page.tsx`: お気に入り画面での単語検索ロジックを修正
- `app/api/favorites/add/route.ts`: API側は正常に動作（修正不要）
- `app/api/favorites/list/route.ts`: API側は正常に動作（修正不要）

## 動作確認

修正後、以下の動作が確認できるようになりました：

- ✅ note100選の単語を長押しでお気に入り登録できる
- ✅ お気に入り画面（⭐️ お気に入り）にNoteカテゴリーの単語も表示される
- ✅ お気に入り登録後、星マークが正しく更新される
- ✅ お気に入り削除も正常に動作する

## 今後の注意点

新しいNote記事を追加する際も、同様のロジックで動作するため、追加の修正は不要です。ただし、以下の点に注意してください：

1. **カテゴリーIDの一貫性**: NoteカテゴリーのIDは`note_`で始まる形式を維持する
2. **単語データの構造**: Noteカテゴリーの単語も`Word`インターフェースに準拠している必要がある
3. **お気に入りキーの形式**: `categoryId:wordChinese`の形式を維持する

## 日付

2025年11月5日

## 関連コミット

- `fix: お気に入り画面でNoteカテゴリーのお気に入りも表示されるように修正`
- `fix: noteカテゴリーのお気に入り登録を徹底的に修正（API側にもデバッグログ追加、状態更新の確認を強化）`
- `fix: 通常カテゴリー選択時にselectedNoteCategoryをリセットして、お気に入り登録時のcategoryId取得を確実に`

