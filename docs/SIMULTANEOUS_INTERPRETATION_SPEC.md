# 同時通訳モード 仕様書・フロー図

最終更新: 2025年1月

## 目次

1. [概要](#概要)
2. [実装機能一覧](#実装機能一覧)
3. [システムアーキテクチャ](#システムアーキテクチャ)
4. [データフロー](#データフロー)
5. [UI/UX設計](#uiux設計)
6. [技術的な工夫点](#技術的な工夫点)
7. [状態管理](#状態管理)
8. [API仕様](#api仕様)

---

## 概要

同時通訳モード（隠しモード）は、リアルタイムで日本語音声を認識し、広東語に翻訳して表示する機能です。ユーザーはマイクボタンを長押しすることで音声入力を行い、即座に翻訳結果を確認できます。

### 主な特徴

- **リアルタイム音声認識**: Web Speech APIを使用した日本語音声認識
- **高速翻訳**: DeepSeek APIによる日本語→広東語翻訳
- **タイムスタンプ表示**: 各テキストに時刻（時間:分 秒）を表示
- **レイテンシー計測**: 翻訳APIの応答時間を表示
- **重複防止**: 同じテキストの重複表示を防止
- **モバイル最適化**: レスポンシブデザインでモバイル対応

---

## 実装機能一覧

### 1. 音声認識機能

**技術スタック:**
- Web Speech API (webkitSpeechRecognition)
- 言語設定: `ja-JP` (日本語)
- モード: `continuous: true` (連続認識)
- 中間結果: `interimResults: true` (確定前の結果も取得)

**機能詳細:**
- 長押し方式の音声入力
- 確定結果（final）と中間結果（interim）の分離処理
- 重複テキストの自動検出とスキップ
- タイムスタンプの自動付与

### 2. 翻訳機能

**技術スタック:**
- DeepSeek API (`https://api.deepseek.com/v1/chat/completions`)
- モデル: `deepseek-chat`
- デバウンス: 50ms（最速リアルタイム処理）

**機能詳細:**
- 日本語テキストの自動検出
- リアルタイム翻訳（50msデバウンス）
- レイテンシー計測（開始時刻～応答時刻）
- 翻訳済みテキストの追跡（Set使用）
- AbortControllerによるリクエストキャンセル

### 3. 表示機能

**UI要素:**
- **広東語翻訳エリア**: 上部、180度回転表示
- **日本語認識エリア**: 中央、最新の確定テキストのみ表示
- **マイクボタン**: 下部、長押しで音声入力

**表示内容:**
- テキスト内容
- タイムスタンプ（形式: `-HH:MM SSs`）
- レイテンシー（広東語のみ、形式: `レイテンシー: XXXms`）

### 4. モバイル最適化

**レイアウト調整:**
- 広東語エリア: `top: 2rem`, `maxHeight: 250px`
- 日本語エリア: `top: calc(2rem + 250px + 0.5rem)`, `bottom: calc(3rem + 120px + 96px + 2rem)`
- マイクボタン: `bottom: calc(3rem + 120px)`, サイズ: `96px × 96px`

**重なり防止:**
- `top`と`bottom`を同時指定して高さを自動計算
- 各エリア間に適切な余白を確保

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    ユーザー操作                          │
│  (マイクボタン長押し)                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│            Web Speech API (音声認識)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ onresult イベント                               │   │
│  │  - final: 確定結果                              │   │
│  │  - interim: 中間結果                         │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              音声認識結果処理                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. 重複チェック (lastProcessedFinalTextRef)     │   │
│  │ 2. タイムスタンプ生成 (getTimestamp)            │   │
│  │ 3. recognizedTextLines に追加                   │   │
│  │    - TextLine { text, timestamp }              │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           翻訳トリガー (useEffect)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. recognizedTextLines の変更を監視             │   │
│  │ 2. 未翻訳テキストを抽出                         │   │
│  │ 3. translatedTextSetRef で重複チェック          │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           翻訳API呼び出し                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. レイテンシー計測開始 (Date.now())            │   │
│  │ 2. /api/translate にPOSTリクエスト              │   │
│  │ 3. AbortController でキャンセル可能             │   │
│  │ 4. デバウンス: 50ms                              │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│         DeepSeek API (翻訳処理)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ モデル: deepseek-chat                           │   │
│  │ プロンプト: "日本語を広東語に翻訳してください"    │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           翻訳結果処理                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. レイテンシー計算 (Date.now() - startTime)    │   │
│  │ 2. 翻訳済みマーク (translatedTextSetRef)        │   │
│  │ 3. translatedTextLines に追加                   │   │
│  │    - TextLine { text, timestamp, latency }     │   │
│  └──────────────────┬────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  UI表示                                  │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 広東語エリア     │  │ 日本語エリア     │            │
│  │ (180度回転)      │  │ (最新のみ表示)   │            │
│  │ - テキスト       │  │ - テキスト       │            │
│  │ - タイムスタンプ │  │ - タイムスタンプ │            │
│  │ - レイテンシー   │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## データフロー

### 1. 音声認識フロー

```
ユーザーがマイクボタンを長押し
    ↓
handleMicPress() 実行
    ↓
recognitionRef.current.start() 実行
    ↓
Web Speech API が音声を認識
    ↓
onresult イベント発火
    ↓
┌─────────────────────────────────┐
│ final 結果がある場合             │
│ 1. 重複チェック                 │
│ 2. タイムスタンプ生成              │
│ 3. recognizedTextLines[0] に追加 │
└─────────────────────────────────┘
    ↓
interim 結果がある場合
    ↓
interimText ステート更新（確定まで表示）
```

### 2. 翻訳フロー

```
recognizedTextLines が更新される
    ↓
useEffect がトリガーされる
    ↓
未翻訳テキストを抽出
    ↓
translatedTextSetRef で重複チェック
    ↓
未翻訳テキストがある場合
    ↓
┌─────────────────────────────────┐
│ デバウンス: 50ms                 │
│ 前回のリクエストをキャンセル      │
│ (AbortController)                │
└─────────────────────────────────┘
    ↓
レイテンシー計測開始 (Date.now())
    ↓
/api/translate にPOSTリクエスト
    ↓
DeepSeek API で翻訳
    ↓
レスポンス受信
    ↓
┌─────────────────────────────────┐
│ 1. レイテンシー計算              │
│ 2. 翻訳済みマーク                 │
│ 3. translatedTextLines[0] に追加 │
└─────────────────────────────────┘
```

### 3. 表示フロー

```
recognizedTextLines / translatedTextLines 更新
    ↓
React が再レンダリング
    ↓
┌─────────────────────────────────────┐
│ 日本語エリア                         │
│ - recognizedTextLines[0] のみ表示    │
│ - 青い背景 (rgba(59, 130, 246, 0.05))│
│ - タイムスタンプ表示                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 広東語エリア                         │
│ - translatedTextLines[0] のみ表示    │
│ - 180度回転 (rotate(-180deg))       │
│ - タイムスタンプ + レイテンシー表示 │
└─────────────────────────────────────┘
```

---

## UI/UX設計

### レイアウト構造（モバイル）

```
┌─────────────────────────────────────┐
│ ブラウザアドレスバー                 │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 広東語翻訳エリア              │   │
│  │ top: 2rem                    │   │
│  │ maxHeight: 250px              │   │
│  │ (180度回転)                   │   │
│  │ - テキスト                    │   │
│  │ - タイムスタンプ              │   │
│  │ - レイテンシー                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 日本語認識エリア              │   │
│  │ top: calc(2rem + 250px + 0.5rem)│
│  │ bottom: calc(3rem + 120px + 96px + 2rem)│
│  │ - テキスト                    │   │
│  │ - タイムスタンプ              │   │
│  └─────────────────────────────┘   │
│                                     │
│         ┌──────────┐                │
│         │ マイク    │                │
│         │ ボタン    │                │
│         │ (96px)    │                │
│         └──────────┘                │
│                                     │
│  カントン語通訳                      │
│  ボタンを押すだけでスパッと通訳！    │
│                                     │
├─────────────────────────────────────┤
│ ブラウザナビゲーションバー           │
└─────────────────────────────────────┘
```

### 色とスタイル

**日本語エリア:**
- 背景色: `rgba(59, 130, 246, 0.05)` (薄い青)
- ボーダー: `3px solid rgba(59, 130, 246, 0.3)` (左側)
- テキスト色: `#111827` (濃いグレー)
- タイムスタンプ: `#6b7280` (グレー)、フォントサイズ: `0.875rem`

**広東語エリア:**
- 背景色: `rgba(59, 130, 246, 0.05)` (薄い青)
- ボーダー: `3px solid rgba(59, 130, 246, 0.3)` (左側)
- テキスト色: `#111827` (濃いグレー)
- タイムスタンプ: `#6b7280` (グレー)、フォントサイズ: `0.875rem`
- 回転: `rotate(-180deg)` (180度回転)

---

## 技術的な工夫点

### 1. 重複防止メカニズム

**問題:**
- 音声認識APIが同じテキストを複数回返す可能性
- 翻訳APIが同じテキストを複数回翻訳する可能性

**解決策:**
```typescript
// 音声認識の重複防止
const lastProcessedFinalTextRef = useRef<string>('');
if (trimmed === lastProcessedFinalTextRef.current) {
  return; // スキップ
}

// 翻訳の重複防止
const translatedTextSetRef = useRef<Set<string>>(new Set());
if (translatedTextSetRef.current.has(textToTranslate)) {
  continue; // スキップ
}
```

### 2. パフォーマンス最適化

**デバウンス:**
- 翻訳リクエストを50msデバウンスして、過剰なAPI呼び出しを防止

**AbortController:**
- 前回の翻訳リクエストをキャンセル可能にし、無駄なリクエストを防止

**Keep-Alive:**
- HTTP接続を維持して、リクエストのオーバーヘッドを削減

### 3. リアルタイム処理

**中間結果（interim）の処理:**
- 確定前のテキストも表示し、リアルタイム感を向上
- 確定時にinterimを除去してからfinalを追加

**最新テキストのみ表示:**
- `recognizedTextLines[0]` と `translatedTextLines[0]` のみ表示
- 古いテキストは配列に保持するが表示しない

### 4. モバイル最適化

**位置計算:**
```typescript
// 広東語エリア
top: '2rem'
maxHeight: '250px'

// 日本語エリア
top: 'calc(2rem + 250px + 0.5rem)'  // 広東語エリアの直下
bottom: 'calc(3rem + 120px + 96px + 2rem)'  // マイクボタンの上端 + 余白
```

**高さの自動計算:**
- `top`と`bottom`を同時指定することで、高さを自動計算
- 画面サイズに応じて適切に調整

---

## 状態管理

### 主要な状態変数

```typescript
// モード管理
const [isHiddenMode, setIsHiddenMode] = useState(false);
const [isRecording, setIsRecording] = useState(false);

// テキスト管理
const [recognizedText, setRecognizedText] = useState('');  // 下位互換用
const [finalText, setFinalText] = useState('');  // 累積テキスト
const [interimText, setInterimText] = useState('');  // 中間結果

// タイムスタンプ付きテキスト行
const [recognizedTextLines, setRecognizedTextLines] = useState<TextLine[]>([]);
const [translatedTextLines, setTranslatedTextLines] = useState<TextLine[]>([]);

// 翻訳管理
const [translatedText, setTranslatedText] = useState('');  // 下位互換用
```

### Ref管理

```typescript
// 音声認識
const recognitionRef = useRef<any>(null);

// 翻訳制御
const translateDebounceRef = useRef<NodeJS.Timeout | null>(null);
const translateAbortControllerRef = useRef<AbortController | null>(null);

// 重複防止
const lastTranslatedTextRef = useRef<string>('');
const lastProcessedFinalTextRef = useRef<string>('');
const translatedTextSetRef = useRef<Set<string>>(new Set());
```

### TextLine型定義

```typescript
interface TextLine {
  text: string;              // テキスト内容
  timestamp: string;         // タイムスタンプ（例: "-12:40 39s"）
  latency?: number;          // レイテンシー（ミリ秒、広東語のみ）
}
```

---

## API仕様

### `/api/translate` エンドポイント

**リクエスト:**
```typescript
POST /api/translate
Content-Type: application/json

{
  "text": "日本語テキスト"
}
```

**レスポンス:**
```typescript
{
  "translated": "広東語翻訳テキスト",
  "translatedText": "広東語翻訳テキスト"  // 下位互換
}
```

**処理フロー:**
1. リクエスト受信
2. DeepSeek APIにリクエスト送信
3. 翻訳結果を抽出
4. レスポンス返却

**エラーハンドリング:**
- ネットワークエラー: コンソールにエラー出力
- APIエラー: エラーメッセージを返却

---

## フローチャート

### Mermaid形式のフローチャート

```mermaid
graph TD
    A[隠しモード起動] --> B[UI表示]
    B --> C{ユーザーがマイクボタンを長押し}
    C -->|長押し| D[音声認識開始]
    C -->|離す| E[音声認識停止]
    
    D --> F[Web Speech API: 音声認識]
    F --> G{結果タイプ}
    G -->|final| H[確定結果処理]
    G -->|interim| I[中間結果表示]
    
    H --> J[重複チェック]
    J -->|重複| K[スキップ]
    J -->|新規| L[タイムスタンプ生成]
    L --> M[recognizedTextLines更新]
    
    M --> N[翻訳トリガー]
    N --> O[未翻訳テキスト抽出]
    O --> P{翻訳済み?}
    P -->|Yes| Q[スキップ]
    P -->|No| R[デバウンス: 50ms]
    
    R --> S[レイテンシー計測開始]
    S --> T[/api/translate呼び出し]
    T --> U[DeepSeek API: 翻訳]
    U --> V[レイテンシー計算]
    V --> W[翻訳済みマーク]
    W --> X[translatedTextLines更新]
    
    X --> Y[UI更新]
    Y --> Z[日本語エリア表示]
    Y --> AA[広東語エリア表示]
    
    E --> AB[継続可能]
    AB --> C
```

### 全体フロー

```
開始
  ↓
隠しモード起動（3回クリック）
  ↓
UI表示（広東語エリア、日本語エリア、マイクボタン）
  ↓
ユーザーがマイクボタンを長押し
  ↓
┌─────────────────────────┐
│ 音声認識開始             │
│ - Web Speech API起動     │
│ - continuous: true       │
│ - interimResults: true  │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 音声認識結果受信         │
│ - final: 確定結果        │
│ - interim: 中間結果      │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 重複チェック             │
│ - 直前のテキストと比較   │
│ - 同じ場合はスキップ     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ タイムスタンプ生成       │
│ - getTimestamp()         │
│ - 形式: "-HH:MM SSs"     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ recognizedTextLines更新 │
│ - [0]に最新テキスト追加  │
│ - TextLine型で保存       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 翻訳トリガー             │
│ - useEffect監視          │
│ - 未翻訳テキスト抽出     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ デバウンス処理           │
│ - 50ms待機               │
│ - 前回リクエストキャンセル│
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 翻訳API呼び出し          │
│ - レイテンシー計測開始   │
│ - /api/translate POST    │
│ - AbortController使用    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ DeepSeek API処理         │
│ - 日本語→広東語翻訳      │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 翻訳結果処理             │
│ - レイテンシー計算       │
│ - 翻訳済みマーク         │
│ - translatedTextLines更新│
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ UI更新                   │
│ - 日本語エリア表示       │
│ - 広東語エリア表示        │
│ - タイムスタンプ表示      │
│ - レイテンシー表示        │
└──────────┬──────────────┘
           ↓
ユーザーがマイクボタンを離す
  ↓
音声認識停止
  ↓
（継続可能）
```

### 重複防止フロー

```
音声認識結果受信
  ↓
final結果がある？
  ↓ YES
直前のテキストと比較
  ↓
同じテキスト？
  ↓ YES → スキップ
  ↓ NO
タイムスタンプ生成
  ↓
recognizedTextLines更新
  ↓
配列全体をチェック
  ↓
重複がある？
  ↓ YES → スキップ
  ↓ NO
新しい行として追加
```

### 翻訳フロー

```
recognizedTextLines更新
  ↓
未翻訳テキスト抽出
  ↓
translatedTextSetRefでチェック
  ↓
既に翻訳済み？
  ↓ YES → スキップ
  ↓ NO
デバウンス: 50ms
  ↓
前回リクエストキャンセル
  ↓
レイテンシー計測開始
  ↓
/api/translate呼び出し
  ↓
レスポンス受信
  ↓
レイテンシー計算
  ↓
翻訳済みマーク
  ↓
translatedTextLines更新
```

---

## 実装の詳細

### タイムスタンプ生成

```typescript
const getTimestamp = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `-${hours}:${minutes} ${seconds}s`;
};
```

**出力例:**
- `-12:40 39s`
- `-15:18 57s`

### レイテンシー計測

```typescript
// 開始時刻
const translateStartTime = Date.now();

// API呼び出し
const response = await fetch('/api/translate', { ... });

// レイテンシー計算
const latency = Date.now() - translateStartTime;
```

**表示形式:**
- `レイテンシー: 3485ms`

### 重複チェック

```typescript
// 音声認識の重複チェック
const isDuplicate = prev.some(line => line.text === trimmed);
if (isDuplicate) {
  return prev; // 追加しない
}

// 翻訳の重複チェック
if (translatedTextSetRef.current.has(textToTranslate)) {
  continue; // スキップ
}
```

---

## モバイル最適化の詳細

### 位置計算式

**広東語エリア:**
```
top = 2rem (32px)
maxHeight = 250px
実際の高さ = 250px + padding上下(1.5rem * 2 = 48px) = 約298px
下端 = 32px + 298px = 330px
```

**日本語エリア:**
```
top = calc(2rem + 250px + 0.5rem) = 32px + 250px + 8px = 290px
bottom = calc(3rem + 120px + 96px + 2rem) = 48px + 120px + 96px + 32px = 296px
高さ = 100vh - 296px - 290px = 100vh - 586px
```

**マイクボタン:**
```
bottom = calc(3rem + 120px) = 48px + 120px = 168px
高さ = 96px
上端 = 100vh - 168px - 96px = 100vh - 264px
```

### 重なり防止の仕組み

1. **top指定**: 広東語エリアの下端から開始
2. **bottom指定**: マイクボタンの上端より上で終了
3. **自動高さ計算**: `top`と`bottom`を同時指定することで、高さが自動計算される
4. **余白確保**: 各エリア間に適切な余白を設定

---

## パフォーマンス最適化

### 1. デバウンス処理

```typescript
// 50msデバウンス
translateDebounceRef.current = setTimeout(async () => {
  // 翻訳処理
}, 50);
```

**効果:**
- 過剰なAPI呼び出しを防止
- リアルタイム感を維持

### 2. AbortController

```typescript
// 前回のリクエストをキャンセル
if (translateAbortControllerRef.current) {
  translateAbortControllerRef.current.abort();
}

// 新しいリクエスト
translateAbortControllerRef.current = new AbortController();
const response = await fetch('/api/translate', {
  signal: abortController.signal,
  // ...
});
```

**効果:**
- 無駄なリクエストをキャンセル
- ネットワークリソースの節約

### 3. Keep-Alive

```typescript
const response = await fetch('/api/translate', {
  keepalive: true,
  // ...
});
```

**効果:**
- HTTP接続を維持
- リクエストのオーバーヘッドを削減

---

## エラーハンドリング

### 音声認識エラー

```typescript
recognitionRef.current.onerror = (event: any) => {
  if (event.error !== 'aborted') {
    console.error('音声認識エラー:', event.error);
    setIsRecording(false);
  }
};
```

### 翻訳エラー

```typescript
try {
  const response = await fetch('/api/translate', { ... });
  // ...
} catch (error: any) {
  if (error.name !== 'AbortError') {
    console.error('翻訳エラー:', error);
  }
}
```

**処理:**
- `AbortError`は正常なキャンセルとして無視
- その他のエラーはコンソールに出力

---

## 今後の改善案

1. **オフライン対応**: 音声認識結果のキャッシュ
2. **履歴機能**: 過去の翻訳履歴を保存・表示
3. **音声再生**: 翻訳結果を音声で再生
4. **多言語対応**: 他の言語への翻訳対応
5. **設定機能**: デバウンス時間や表示オプションのカスタマイズ

---

## まとめ

同時通訳モードは、以下の技術と工夫により実現されています：

1. **Web Speech API**: リアルタイム音声認識
2. **DeepSeek API**: 高速翻訳
3. **重複防止**: RefとSetを使用した効率的な重複チェック
4. **パフォーマンス最適化**: デバウンス、AbortController、Keep-Alive
5. **モバイル最適化**: レスポンシブレイアウトと重なり防止
6. **UX向上**: タイムスタンプ、レイテンシー表示、最新テキストのみ表示

これらの実装により、スムーズで使いやすい同時通訳機能を提供しています。

