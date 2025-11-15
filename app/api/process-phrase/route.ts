import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// CSVデータとJSONデータを事前に読み込む
const jyutpingDataPath = path.join(process.cwd(), 'public/google_drive_data.csv');
const katakanaDataPath = path.join(process.cwd(), 'public/katakana_conversion_data.csv');

// DeepSeek API設定
const DEEPSEEK_API_KEY = 'sk-4762a303780f4233a5d1703c9b627a71';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

let jyutpingDict: Record<string, string[]> = {};
let katakanaDict: Record<string, string> = {};
let dataLoaded = false;

function loadData() {
  if (dataLoaded) return;
  
  // 粤ピンデータの読み込み
  const jyutpingContent = fs.readFileSync(jyutpingDataPath, 'utf-8');
  const jyutpingResult = Papa.parse(jyutpingContent, {
    delimiter: '\t',
    header: true,
    skipEmptyLines: true
  });
  
  jyutpingDict = {};
  (jyutpingResult.data as any[]).forEach((row: any) => {
    const char = row.CH;
    const jyutping = row.JP;
    if (char && jyutping) {
      if (!jyutpingDict[char]) {
        jyutpingDict[char] = [];
      }
      jyutpingDict[char].push(jyutping);
    }
  });
  
  // カタカナ変換データの読み込み
  const katakanaContent = fs.readFileSync(katakanaDataPath, 'utf-8');
  katakanaDict = JSON.parse(katakanaContent);
  
  dataLoaded = true;
}

function findAllJyutpingsAndKatakanaForPhrase(phrase: string) {
  loadData();
  
  const resultForPhrase: any[] = [];
  const skipCharacters = new Set([' ', '，', '。', '「', '」', '＜', '＞', '（', '）', '-', '@', '[', ']','|','｜', '?', '!','/', '、']);
  
  for (let i = 0; i < phrase.length; i++) {
    const char = phrase[i];
    if (skipCharacters.has(char)) {
      resultForPhrase.push([char, [char], [char]]);
    } else {
      const jyutpings = jyutpingDict[char] || ["Not found"];
      const katakanas: string[] = [];
      jyutpings.forEach((jyutping: string) => {
        const jyutpingBase = jyutping.replace(/\d+$/, '');
        const toneMatch = jyutping.match(/\d+$/);
        const katakana = katakanaDict[jyutpingBase] || "Not found";
        if (katakana !== "Not found") {
          katakanas.push(katakana + (toneMatch ? toneMatch[0] : ''));
        } else {
          katakanas.push("Not found");
        }
      });
      resultForPhrase.push([char, jyutpings, katakanas]);
    }
  }
  return resultForPhrase;
}

async function translateJapaneseToCantonese(japaneseText: string): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional translator specializing in Japanese to Cantonese translation. Translate the given Japanese text into natural, conversational Cantonese using Traditional Chinese characters. Provide ONLY the Cantonese translation without any explanations, notes, or additional text."
          },
          {
            role: "user",
            content: `次の日本語文章を広東語に翻訳して\n\n${japaneseText}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      })
    });
    
    const jsonResponse = await response.json();
    let translatedText = jsonResponse.choices[0].message.content.trim();
    
    console.log('📝 DeepSeek生レスポンス:', translatedText.substring(0, 200));
    
    // 説明文や括弧付きの説明を削除
    // 例: "(我將嘗試把這首富有詩意的日文詩翻譯成廣東話，盡量保留原作的意境與韻味)" のような説明文を削除
    translatedText = translatedText.replace(/^[（(].*?[）)]\s*/g, ''); // 括弧で囲まれた説明文を削除
    
    // 改行で区切られた場合、最初の空行以降が説明文の可能性があるので、最初の空行までの部分を取得
    const lines = translatedText.split('\n');
    let resultLines: string[] = [];
    let foundTranslation = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 空行をスキップ
      if (!trimmedLine) {
        if (foundTranslation) break; // 翻訳が見つかった後の空行は終了
        continue;
      }
      // 説明文のパターンを検出（括弧で始まる、または英語/日本語の説明）
      if (/^[（(]/.test(trimmedLine) || /^(我將|我會|I will|I'll|I'm|翻訳|Translation)/i.test(trimmedLine)) {
        continue; // 説明文をスキップ
      }
      // 広東語の文字（繁体字）が含まれている行を翻訳として採用
      if (/[\u4E00-\u9FFF]/.test(trimmedLine)) {
        resultLines.push(trimmedLine);
        foundTranslation = true;
      }
    }
    
    // 結果が得られない場合は、元のテキストから説明文以外を抽出
    if (resultLines.length === 0) {
      // 括弧で囲まれた部分を削除
      translatedText = translatedText.replace(/[（(][^）)]*[）)]/g, '');
      // 先頭・末尾の引用符や角括弧を削除
      translatedText = translatedText.replace(/^["'「」『』\[\]\s]+|["'「」『』\[\]\s]+$/g, '');
      resultLines = translatedText.split('\n').filter((line: string) => {
        const trimmed = line.trim();
        return trimmed && /[\u4E00-\u9FFF]/.test(trimmed);
      });
    }
    
    const finalTranslation = resultLines.join('\n').trim();
    
    // 翻訳結果が空または短すぎる場合はエラー
    if (!finalTranslation || finalTranslation.length < 3) {
      console.error('❌ 翻訳結果が空:', { original: translatedText.substring(0, 100) });
      throw new Error('翻訳結果が空または不十分です');
    }
    
    console.log('✅ 最終翻訳結果:', finalTranslation.substring(0, 100));
    return finalTranslation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

function isJapaneseText(text: string): boolean {
  if (!text || text.trim() === '') {
    return false;
  }

  // 日本語文字（ひらがな、カタカナ）が含まれているかチェック
  // 広東語の繁体字と日本語の漢字は重複するため、仮名の存在を日本語判定の主条件とする
  const hiraganaKatakanaRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (hiraganaKatakanaRegex.test(text)) {
    return true;
  }

  return false;
}

async function translateCantoneseToJapanese(cantoneseText: string, attempt = 1): Promise<string> {                                                              
  if (!cantoneseText || cantoneseText.trim() === '') {
    return '';
  }

  const baseSystemPrompt =
    'You are a professional translator. Convert Traditional Chinese (Cantonese) text into natural Japanese. ' +
    'The output must consist solely of Japanese characters (kanji, hiragana, katakana) and necessary punctuation. ' +
    'Do not include explanations, transliterations, or English letters.';

  const reinforcementPrompt =
    '必ず自然な日本語で翻訳し、平仮名または片仮名を含めてください。日本語以外の文字（英字や意味不明な記号）は出力しないでください。';

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: attempt === 1 ? baseSystemPrompt : `${baseSystemPrompt} ${reinforcementPrompt}`,
          },
          {
            role: 'user',
            content:
              `次の広東語（繁体字中国語）の文章を自然な日本語に翻訳してください。\n` +
              `${attempt === 1 ? '' : `${reinforcementPrompt}\n`}\n${cantoneseText}`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.1,
        top_p: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cantonese→Japanese translation API error:', response.status, errorText);
      return '';
    }

    const jsonResponse = await response.json();
    let translatedText = jsonResponse.choices?.[0]?.message?.content?.trim() || '';

    translatedText = translatedText.replace(/^[（(].*?[）)]\s*/g, '');
    translatedText = translatedText.replace(/^["'「」『』\[\]\s]+|["'「」『』\[\]\s]+$/g, '');
    translatedText = translatedText.replace(/^(翻訳結果|翻訳|Translation)[：:]\s*/i, '').trim();

    const lines = translatedText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const japaneseRegex = /[\u3040-\u30FF]/;
    const candidateLine = lines.find((line: string) => japaneseRegex.test(line)) || translatedText;
    const cleanedCandidate = candidateLine
      .replace(/^[（(].*?[）)]\s*/g, '')
      .replace(/^["'「」『』\[\]\s]+|["'「」『』\[\]\s]+$/g, '')
      .trim();

    const hasKana = japaneseRegex.test(cleanedCandidate);
    const hasAlphabet = /[A-Za-z]/.test(cleanedCandidate);

    if (!hasKana || hasAlphabet) {
      console.warn('⚠️ 日本語翻訳の品質が低い可能性:', {
        attempt,
        preview: cleanedCandidate.substring(0, 120),
      });
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return translateCantoneseToJapanese(cantoneseText, attempt + 1);
      }
      return '';
    }

    return cleanedCandidate;
  } catch (error) {
    console.error('Cantonese→Japanese translation error:', error);
    return '';
  }
}

async function generateExampleSentence(word: string, originalJapanese?: string | null): Promise<{ cantonese: string; japanese: string; full: string }> {
  if (!word || word.trim() === '') {
    return {
      cantonese: '例文生成エラー',
      japanese: '単語が無効です',
      full: '例文生成エラー'
    };
  }
  
  // 元の日本語テキストがある場合（翻訳された場合）、例文生成をスキップして元の日本語を返す
  if (originalJapanese) {
    return {
      cantonese: word, // 翻訳された広東語テキスト
      japanese: originalJapanese, // 元の日本語テキスト
      full: `${word} (${originalJapanese})`
    };
  }
  
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a Cantonese language teacher. Generate a simple, natural example sentence using the given Cantonese word or phrase. Provide the sentence in Cantonese with Japanese translation in parentheses. Format: [Cantonese sentence] ([Japanese translation]). Keep it conversational and beginner-friendly. Do not add any other text or explanations."
          },
          {
            role: "user",
            content: `Generate an example sentence using this Cantonese word or phrase: ${word}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });
    
    const jsonResponse = await response.json();
    let fullExample = jsonResponse.choices[0].message.content.trim();
    
    // 不要な記号や引用符、角括弧を削除
    fullExample = fullExample
      .replace(/^["'「」『』\[\]]|["'「」『』\[\]]$/g, '') // 先頭・末尾の引用符と角括弧を削除
      .replace(/\[|\]/g, '') // 文中の角括弧も削除
      .trim();
    
    // 広東語部分と日本語翻訳部分を分離
    let cantonesePart = '';
    let japanesePart = '';
    
    // 括弧で区切られている場合の処理
    const parenMatch = fullExample.match(/^(.+?)\s*[（(]\s*(.+?)\s*[）)]$/);
    if (parenMatch) {
      cantonesePart = parenMatch[1].trim();
      japanesePart = parenMatch[2].trim();
    } else {
      // 括弧がない場合は、日本語文字が含まれているかチェック
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      if (japaneseRegex.test(fullExample)) {
        // 日本語文字が含まれている場合、最初の日本語文字から分割
        const japaneseIndex = fullExample.search(japaneseRegex);
        cantonesePart = fullExample.substring(0, japaneseIndex).trim();
        japanesePart = fullExample.substring(japaneseIndex).trim();
      } else {
        // 日本語文字がない場合は広東語部分として扱う
        cantonesePart = fullExample;
        japanesePart = '';
      }
    }
    
    return {
      cantonese: cantonesePart,
      japanese: japanesePart,
      full: fullExample
    };
  } catch (error) {
    console.error('Example sentence generation error:', error);
    return {
      cantonese: '例文生成エラーが発生しました',
      japanese: '',
      full: '例文生成エラーが発生しました'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phrase } = body;
    
    if (!phrase) {
      return NextResponse.json({ error: 'Phrase is required' }, { status: 400 });
    }
    
    // 日本語テキストの場合は広東語に翻訳
    let cantonesePhrase = phrase;
    let originalJapanese = null;
    
    let isJapanese = isJapaneseText(phrase);
    const containsKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(phrase);
    console.log('🔍 テキスト判定:', { phrase: phrase.substring(0, 50), isJapanese });
    
    if (isJapanese) {
      try {
        console.log('🌐 日本語を検出、翻訳開始...');
        cantonesePhrase = await translateJapaneseToCantonese(phrase);
        originalJapanese = phrase;
        console.log('✅ 翻訳完了:', { 
          original: phrase.substring(0, 50), 
          translated: cantonesePhrase.substring(0, 50) 
        });

        if (!containsKana) {
          const cantoneseIndicators = /[呀啦喺咁嘅冇哋唔嗰嚟噉咗嘢佢咩囉喎]/;
          const punctuationRemovalRegex = /[\p{P}\p{S}\s]/gu;
          const normalizedOriginal = phrase.replace(punctuationRemovalRegex, '');
          const normalizedTranslated = cantonesePhrase.replace(punctuationRemovalRegex, '');

          let similarity = 0;
          if (normalizedOriginal.length > 0 && normalizedTranslated.length > 0) {
            const originalChars = Array.from(normalizedOriginal);
            const translatedChars = Array.from(normalizedTranslated);
            const minLength = Math.min(originalChars.length, translatedChars.length);
            let matchCount = 0;
            for (let i = 0; i < minLength; i++) {
              if (originalChars[i] === translatedChars[i]) {
                matchCount++;
              }
            }
            similarity = minLength > 0 ? matchCount / minLength : 0;
          }

          const isMostlyUnchanged =
            normalizedOriginal.length > 0 &&
            normalizedTranslated.length > 0 &&
            (
              normalizedOriginal === normalizedTranslated ||
              normalizedOriginal.includes(normalizedTranslated) ||
              normalizedTranslated.includes(normalizedOriginal) ||
              similarity >= 0.95
            );

          if (
            cantoneseIndicators.test(phrase) ||
            (phrase.length >= 20 && isMostlyUnchanged)
          ) {
            console.warn('🔁 日本語判定をキャンセル: 広東語特有のパターンを検出', {
              phrasePreview: phrase.substring(0, 60),
              normalizedOriginalLength: normalizedOriginal.length,
              normalizedTranslatedLength: normalizedTranslated.length,
              similarity,
              isMostlyUnchanged,
            });
            isJapanese = false;
            originalJapanese = null;
            cantonesePhrase = phrase;
          }
        }
      } catch (error) {
        console.error('❌ 翻訳失敗:', error);
        return NextResponse.json({ 
          error: '翻訳に失敗しました。日本語テキストを広東語に翻訳できませんでした。',
          jyutping: '',
          katakana: '',
          jyutpingMulti: '',
          katakanaMulti: '',
          exampleCantonese: '翻訳エラーが発生しました',
          exampleJapanese: phrase,
          exampleFull: '翻訳エラーが発生しました'
        }, { status: 500 });
      }
    } else {
      console.log('📝 広東語テキストとして処理');
    }
    
    const results = findAllJyutpingsAndKatakanaForPhrase(cantonesePhrase);
    
    const jyutpingArray: string[] = [];
    const jyutpingMultiArray: string[] = [];
    const katakanaArray: string[] = [];
    const katakanaMultiArray: string[] = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const jyutpings = result[1];
      const katakanas = result[2];
      
      jyutpingArray.push(jyutpings[0]);
      jyutpingMultiArray.push(jyutpings.length > 1 ? jyutpings.slice(1).join("・") : "無し");
      katakanaArray.push(katakanas[0]);
      katakanaMultiArray.push(katakanas.length > 1 ? katakanas.slice(1).join("・") : "無し");
    }
    
    const jyutpingResult = jyutpingArray.join("・");
    const katakanaResult = katakanaArray.join("・");
    
    // 例文生成（翻訳された広東語テキストを使用、元の日本語テキストも渡す）
    const exampleData = await generateExampleSentence(cantonesePhrase, originalJapanese);

    let japaneseTranslation = originalJapanese;
    if (!japaneseTranslation) {
      const translated = await translateCantoneseToJapanese(cantonesePhrase);
      japaneseTranslation = translated && translated.trim().length > 0 ? translated : '翻訳に失敗しました';
    }

    let exampleJapanese = originalJapanese || exampleData.japanese;
    if ((!exampleJapanese || exampleJapanese.trim() === '' || exampleJapanese.trim() === exampleData.cantonese.trim()) && exampleData.cantonese && !exampleData.cantonese.includes('エラー')) {
      const translatedExample = await translateCantoneseToJapanese(exampleData.cantonese);
      if (translatedExample && translatedExample.trim()) {
        exampleJapanese = translatedExample;
      }
    }
    if (!exampleJapanese || !exampleJapanese.trim()) {
      exampleJapanese = '翻訳に失敗しました';
    }

    return NextResponse.json({
      jyutping: jyutpingResult,
      katakana: katakanaResult,
      jyutpingMulti: jyutpingMultiArray.join("・"),
      katakanaMulti: katakanaMultiArray.join("・"),
      exampleCantonese: exampleData.cantonese,
      exampleJapanese: exampleJapanese,
      exampleFull: exampleData.full,
      originalText: originalJapanese || null,
      translatedText: originalJapanese ? cantonesePhrase : null,
      japaneseTranslation: japaneseTranslation || ''
    });
  } catch (error) {
    console.error('Error processing phrase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

