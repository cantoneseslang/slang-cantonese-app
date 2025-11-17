# モバイルでの「一」発音問題の解決方法

## 問題の概要

広東語の数字「一」を含む単語（「一百」「一千」「一萬」など）が、PC版ウェブでは正常に発音されるが、モバイルデバイス（iOS/Android）では冒頭の「一」が発音されない、または聞き取れない問題が発生していました。

## 問題の詳細

### 症状
- **PC版**: 「一百」が正常に「yat1 baak3」と発音される
- **モバイル版**: 「一百」が「baak3」のみ発音され、「yat1」が抜け落ちる
- 影響範囲: 「一」「一百」「一千」「一萬」など、「一」で始まる数字表現

### 技術的な原因

1. **音声の冒頭が切れる問題**
   - モバイルブラウザでは、音声のデコードと再生のタイミングがPCと異なる
   - 音声データの冒頭部分がデコード完了前に再生が開始され、最初の音素が失われる

2. **Google TTS APIの動作**
   - テキストをそのまま送信した場合、モバイルでは冒頭の発音が生成されない可能性がある
   - SSML（Speech Synthesis Markup Language）を使用することで、より制御可能な音声生成が可能

3. **ブラウザの音声再生タイミング**
   - `oncanplaythrough`イベントが発火しても、実際のデコードが完全に終わっていない場合がある
   - モバイルでは特に、デコード処理に時間がかかる

## 解決方法

### 1. SSML（Speech Synthesis Markup Language）の使用

PCで機能していたSSMLの`<break>`タグをモバイルでも採用しました。

#### 実装内容

**API側（`app/api/generate-speech/route.ts`）**:

```typescript
// 「一」または特定の数字で始まる場合の処理
if (text === '一' || text.startsWith('一百') || text.startsWith('一千') || text.startsWith('一萬') || cantoneseNumberRegex.test(text)) {
  // PCとモバイルの両方でSSMLを使用
  // モバイルではより長いbreak時間を使用して冒頭を保護
  const breakTime = isMobile ? '200ms' : '50ms';
  finalText = `<speak><break time="${breakTime}"/>${text}</speak>`;
  useSSML = true;
}
```

**効果**:
- `<break time="200ms"/>`により、音声の冒頭に200msの無音を追加
- この無音により、音声の冒頭部分が確実に生成され、再生時に保護される
- PCでは50ms、モバイルでは200msと、デバイスに応じて調整

### 2. 再生待機時間の延長

クライアント側で、音声のデコード完了を確実に待ってから再生を開始します。

#### 実装内容

**クライアント側（`app/page.tsx`）**:

```typescript
audio.oncanplaythrough = () => {
  // モバイル対応: 再生前に待機を増やし、確実にデコード完了を待つ
  // 「一」の頭切れ対策として、モバイルでは800ms、PCでは300ms待機
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const waitTime = isMobile ? 800 : 300;
  
  setTimeout(() => {
    audio.currentTime = 0; // 再生位置を明示的に0にリセット
    const playPromise = audio.play();
    // ...
  }, waitTime);
};
```

**効果**:
- `oncanplaythrough`イベント発火後、モバイルでは800ms待機してから再生
- これにより、音声のデコードが完全に完了するまで待機
- PCでは300ms、モバイルでは800msと、デバイスに応じて調整

### 3. 話速の調整（補助的な対策）

モバイルでは、話速を5%遅くすることで、冒頭の発音を保護します。

```typescript
audioConfig: { 
  audioEncoding: 'MP3',
  sampleRateHertz: 24000,
  // モバイルで「一」の発音が抜け落ちる問題対策: 話速を少し遅くする
  ...(isMobile && (text === '一' || text.startsWith('一百') || ...)
    ? { speakingRate: 0.95 } // 5%遅くすることで冒頭の発音を保護
    : {})
}
```

## 解決方法の選択理由

### 試行した方法と結果

1. **全角スペースの追加** ❌
   - テキストの前に全角スペースを追加
   - 結果: Google TTSが全角スペースを無視し、効果なし

2. **SSMLの`<say-as>`タグ** ❌
   - `<say-as interpret-as="cardinal">`を使用
   - 結果: モバイルでは効果が限定的

3. **SSMLの`<break>`タグ** ✅
   - PCで機能していた方法をモバイルにも適用
   - 結果: モバイルでも効果を確認

### 最終的な解決策

**PCで機能していた方法をモバイルにも適用し、パラメータを調整**

- PCでは`<break time="50ms"/>`が機能
- モバイルでは`<break time="200ms"/>`に延長
- 再生待機時間もモバイルでは800msに延長

## パラメータの最適値

### SSMLのbreak時間
- **PC**: 50ms（最小限の無音で自然な発音）
- **モバイル**: 200ms（冒頭を確実に保護）

### 再生待機時間
- **PC**: 300ms（`oncanplaythrough`後の待機時間）
- **モバイル**: 800ms（デコード完了を確実に待つ）

### 話速
- **PC**: 1.0（標準速度）
- **モバイル**: 0.95（5%遅くして冒頭を保護）

## 今後の改善点

1. **デバイス別の最適化**
   - iOSとAndroidで異なる動作がある可能性があるため、デバイス別のパラメータ調整を検討

2. **パフォーマンスの最適化**
   - 待機時間が長いため、ユーザー体験への影響を最小限に抑える方法を検討

3. **他の文字への適用**
   - 「一」以外の文字でも同様の問題が発生する可能性があるため、汎用的な解決策の検討

## 関連ファイル

- `app/api/generate-speech/route.ts`: 音声生成API（SSML処理）
- `app/page.tsx`: クライアント側の音声再生処理（待機時間の制御）

## 参考資料

- [Google Cloud Text-to-Speech SSML](https://cloud.google.com/text-to-speech/docs/ssml)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)

