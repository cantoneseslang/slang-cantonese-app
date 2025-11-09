# 音声認識ログの確認方法

## リアルタイムでログを確認する方法

### 1. ブラウザで確認（推奨）

管理画面にアクセスして、リアルタイムでログを確認できます：

```
http://localhost:3000/admin/speech-logs
```

または本番環境：
```
https://your-domain.com/admin/speech-logs
```

**機能:**
- モバイル/PCのフィルタリング
- 自動更新（3秒ごと）
- セッションごとのグループ表示
- 確定テキストとエラーのハイライト表示

### 2. コマンドラインで確認

#### 最新のログを確認
```bash
npm run check-speech-logs
```

#### モバイルのログのみ
```bash
npm run check-speech-logs:mobile
```

#### PCのログのみ
```bash
npm run check-speech-logs:desktop
```

#### PCとモバイルを比較
```bash
npm run check-speech-logs:compare
```

#### 特定のセッションを確認
```bash
npm run check-speech-logs -- --session <session_id>
```

### 3. MCPで直接SQLを実行

MCPツールを使って、直接SQLクエリを実行できます：

```sql
-- 最新のログ（モバイルとPC）
SELECT 
  event_type,
  device_info->>'is_mobile' as is_mobile,
  browser_info->>'name' as browser_name,
  transcript_data->>'final' as final_text,
  transcript_data->>'interim' as interim_text,
  error_details->>'error' as error,
  session_id,
  created_at
FROM speech_recognition_logs
ORDER BY created_at DESC
LIMIT 50;
```

```sql
-- モバイルの最新セッション
SELECT * FROM speech_recognition_logs
WHERE device_info->>'is_mobile' = 'true'
ORDER BY created_at DESC
LIMIT 20;
```

```sql
-- PCの最新セッション
SELECT * FROM speech_recognition_logs
WHERE device_info->>'is_mobile' = 'false'
ORDER BY created_at DESC
LIMIT 20;
```

```sql
-- セッションごとに結果を集計
SELECT 
  session_id,
  device_info->>'is_mobile' as is_mobile,
  COUNT(*) as event_count,
  COUNT(CASE WHEN event_type = 'result' THEN 1 END) as result_count,
  COUNT(CASE WHEN event_type = 'error' THEN 1 END) as error_count,
  STRING_AGG(DISTINCT transcript_data->>'final', ', ') FILTER (WHERE transcript_data->>'final' IS NOT NULL) as final_texts
FROM speech_recognition_logs
GROUP BY session_id, device_info->>'is_mobile'
ORDER BY MAX(created_at) DESC
LIMIT 10;
```

## テスト手順

1. **PCでテスト**
   - PCブラウザでアプリを開く
   - カントン語通訳モードを起動
   - マイクボタンを長押しして音声入力
   - ブラウザで `/admin/speech-logs` にアクセスして結果を確認

2. **モバイルでテスト**
   - モバイルブラウザでアプリを開く
   - カントン語通訳モードを起動
   - マイクボタンを長押しして音声入力
   - PCブラウザで `/admin/speech-logs` にアクセスして結果を確認

3. **比較**
   - `npm run check-speech-logs:compare` を実行
   - または管理画面でモバイル/PCを切り替えて比較

## ログの見方

### イベントタイプ
- `init`: 音声認識の初期化
- `start`: マイクボタンを押した時
- `result`: 音声認識の結果（onresultイベント）
- `error`: エラー発生
- `end`: 音声認識の終了（onendイベント）
- `release`: マイクボタンを離した時

### 重要な情報
- **確定テキスト**: `transcript_data->>'final'` - 実際に認識されたテキスト
- **中間テキスト**: `transcript_data->>'interim'` - 確定前の中間結果
- **resultIndex**: `transcript_data->>'result_index'` - 処理開始位置
- **resultsLength**: `transcript_data->>'results_length'` - 結果の総数

### 問題の特定
- **後半部分のみ聞き取れる**: `result_index`が0より大きい場合、前半がスキップされている可能性
- **ほとんど聞き取れない**: `result_count`が少ない、または`error_count`が多い
- **PCとモバイルで違い**: `device_info->>'is_mobile'`で比較

## トラブルシューティング

### ログが表示されない
1. ブラウザのコンソールでエラーを確認
2. `/api/speech-recognition-logs` のエンドポイントが動作しているか確認
3. Supabaseのテーブルが正しく作成されているか確認

### ログが多すぎる
- 管理画面でフィルタを使用
- コマンドラインで`--limit`オプションを使用（今後追加予定）

