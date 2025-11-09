# 絶対に禁止されているコードパターン（ブラックリスト）

## ⚠️ 最重要：絶対に使用禁止

### 1. `touchAction: 'none'` または `touch-action: none`

**理由**: タッチイベントが完全に無効化され、モバイルでの音声入力が動作しなくなる

**禁止パターン**:
```typescript
// ❌ 絶対に禁止
style={{
  touchAction: 'none'
}}

// ❌ 絶対に禁止
style={{
  touchAction: isMobile ? 'none' : 'auto'
}}
```

**正しい実装**:
```typescript
// ✅ 正しい（touchActionプロパティを削除）
style={{
  // touchActionは設定しない
}}
```

**影響範囲**: 
- モバイルでの音声入力が完全に無効化される
- タッチイベントが発火しなくなる

**過去の失敗例**:
- 2025年11月9日: `touchAction: 'none'`を追加してモバイル音声入力が無効化
- 2025年11月9日: 再度`touchAction: 'none'`を追加して同じ問題が発生

---

## その他の禁止パターン

### 2. `handleMobileMicPress`のようなモバイル専用ハンドラー

**理由**: 以前失敗したアプローチで、問題を解決しない

**禁止パターン**:
```typescript
// ❌ 絶対に禁止
const handleMobileMicPress = (event: React.TouchEvent) => {
  // タッチイベントから直接音声認識を開始する処理
}
```

**正しい実装**:
```typescript
// ✅ 正しい（既存のhandleMicPressを使用）
const handleMicPress = () => {
  // 既存の実装を使用
}
```

---

## チェック方法

コードを変更する際は、以下のコマンドで禁止パターンをチェックしてください：

```bash
# touchAction: 'none'を検索
grep -r "touchAction.*none" app/
grep -r "touch-action.*none" app/

# handleMobileMicPressを検索
grep -r "handleMobileMicPress" app/
```

## コミット前のチェック

コミット前に必ず以下を確認：
1. `touchAction: 'none'`が含まれていないか
2. `handleMobileMicPress`のような失敗したアプローチが含まれていないか
3. `TODAY_FAILED_FIXES.md`に記載されている失敗アプローチが含まれていないか

