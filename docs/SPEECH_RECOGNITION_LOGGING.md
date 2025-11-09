# 音声認識ログ監視システム

## 概要

音声認識の動作をリアルタイムで監視し、携帯とPCの違いを分析できるログシステムです。

## 機能

- **リアルタイムログ収集**: 音声認識の各イベント（初期化、開始、結果、エラー、終了、リリース）を自動的に記録
- **デバイス情報**: モバイル/デスクトップ、画面サイズ、ブラウザ情報を記録
- **音声認識状態**: continuous、interim_results、langなどの設定を記録
- **トランスクリプトデータ**: interimとfinalのテキスト、resultIndex、resultsLengthを記録
- **エラー詳細**: エラーコード、メッセージを記録
- **セッション追跡**: 同じ長押しセッションを追跡可能

## MCPでログを取得する方法

### 1. 最新のログを取得

```sql
SELECT 
  event_type,
  device_info->>'is_mobile' as is_mobile,
  browser_info->>'name' as browser_name,
  recognition_state->>'continuous' as continuous,
  recognition_state->>'interim_results' as interim_results,
  transcript_data->>'final' as final_text,
  transcript_data->>'interim' as interim_text,
  error_details->>'error' as error,
  session_id,
  created_at
FROM speech_recognition_logs
ORDER BY created_at DESC
LIMIT 20;
```

### 2. モバイルとPCのログを比較

```sql
-- モバイルのログ
SELECT * FROM speech_recognition_logs
WHERE device_info->>'is_mobile' = 'true'
ORDER BY created_at DESC
LIMIT 50;

-- PCのログ
SELECT * FROM speech_recognition_logs
WHERE device_info->>'is_mobile' = 'false'
ORDER BY created_at DESC
LIMIT 50;
```

### 3. エラーのみを取得

```sql
SELECT 
  event_type,
  device_info->>'is_mobile' as is_mobile,
  browser_info->>'name' as browser_name,
  error_details->>'error' as error,
  error_details->>'error_code' as error_code,
  error_details->>'message' as message,
  session_id,
  created_at
FROM speech_recognition_logs
WHERE event_type = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

### 4. セッションごとのログを取得

```sql
SELECT 
  session_id,
  event_type,
  device_info->>'is_mobile' as is_mobile,
  transcript_data->>'final' as final_text,
  transcript_data->>'interim' as interim_text,
  created_at
FROM speech_recognition_logs
WHERE session_id = 'session_xxxxx'
ORDER BY created_at ASC;
```

### 5. 結果イベントのみを取得（音声認識の成功例）

```sql
SELECT 
  device_info->>'is_mobile' as is_mobile,
  browser_info->>'name' as browser_name,
  transcript_data->>'final' as final_text,
  transcript_data->>'interim' as interim_text,
  transcript_data->>'result_index' as result_index,
  transcript_data->>'results_length' as results_length,
  session_id,
  created_at
FROM speech_recognition_logs
WHERE event_type = 'result'
ORDER BY created_at DESC
LIMIT 100;
```

## APIエンドポイント

### POST /api/speech-recognition-logs

ログを送信します（クライアント側から自動的に呼び出されます）。

### GET /api/speech-recognition-logs

ログを取得します。

**クエリパラメータ:**
- `limit`: 取得件数（デフォルト: 100）
- `device_type`: 'mobile' または 'desktop'

**例:**
```
GET /api/speech-recognition-logs?limit=50&device_type=mobile
```

## イベントタイプ

- `init`: 音声認識の初期化
- `start`: 音声認識の開始（マイクボタンを押した時）
- `result`: 音声認識の結果（onresultイベント）
- `error`: エラー発生
- `end`: 音声認識の終了（onendイベント）
- `release`: マイクボタンを離した時

## データ構造

### device_info
```json
{
  "is_mobile": true/false,
  "screen_width": 375,
  "screen_height": 667,
  "user_agent": "..."
}
```

### browser_info
```json
{
  "name": "Chrome" | "Safari" | "Firefox" | "Unknown",
  "platform": "iPhone" | "MacIntel" | "Win32" | ...,
  "language": "ja-JP" | ...
}
```

### recognition_state
```json
{
  "is_recording": true/false,
  "continuous": true/false,
  "interim_results": true/false,
  "lang": "ja-JP"
}
```

### transcript_data
```json
{
  "interim": "中間結果のテキスト",
  "final": "確定結果のテキスト",
  "result_index": 0,
  "results_length": 1
}
```

### error_details
```json
{
  "error": "エラーメッセージ",
  "error_code": "エラーコード",
  "message": "詳細メッセージ"
}
```

## 使用方法

1. アプリを使用すると、自動的にログが収集されます
2. MCPツールを使って、リアルタイムでログを確認できます
3. 携帯とPCの違いを分析するには、`device_info->>'is_mobile'`でフィルタリングします

