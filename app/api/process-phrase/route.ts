import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// CSVデータとJSONデータを事前に読み込む
const jyutpingDataPath = path.join(process.cwd(), 'public/google_drive_data.csv');
const katakanaDataPath = path.join(process.cwd(), 'public/katakana_conversion_data.csv');

// DeepSeek API設定
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in environment variables.');
}

let jyutpingDict: Record<string, string[]> = {};
let katakanaDict: Record<string, string> = {};
let dataLoaded = false;

const normalizeText = (text: string): string =>
  text
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .trim();

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
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not configured');
  }

  const normalized = normalizeText(japaneseText);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `あなたはプロの翻訳者です。以下のルールに従って日本語を広東語（繁体字）に翻訳してください：
1. 意味を損なわず自然な口語表現にする
2. 必要に応じて広東語特有の語彙を使用
3. 訳文のみを出力し、説明や注釈は追加しない`,
          },
          {
            role: 'user',
            content: `以下の日本語テキストを自然な広東語に翻訳してください：\n\n${normalized}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('日本語→広東語翻訳 API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const jsonResponse = await response.json();
    let translatedText = jsonResponse.choices?.[0]?.message?.content?.trim() || '';

    translatedText = translatedText
      .replace(/^["'「」『』【】（）()\[\]]+/, '')
      .replace(/["'「」『』【】（）()\[\]]+$/, '')
      .replace(/\n+/g, ' ')
      .trim();

    console.log('🔧 日本語→広東語 翻訳リクエスト:', {
      originalLength: normalized.length,
      first50Chars: normalized.substring(0, 50),
    });
    console.log('🔧 日本語→広東語 翻訳レスポンス:', {
      rawResponse: jsonResponse.choices?.[0]?.message?.content,
      cleanedResponse: translatedText,
    });

    return translatedText;
  } catch (error) {
    console.error('日本語→広東語 translation error:', error);
    throw new Error('翻訳に失敗しました');
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

async function translateCantoneseToJapanese(cantoneseText: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not configured');
  }
  const normalized = normalizeText(cantoneseText);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `あなたはプロの翻訳者です。以下のルールに従って広東語を日本語に翻訳してください：
1. 広東語の口語表現を適切な日本語の口語に変換
2. 文化や習慣の違いを考慮して自然な日本語に
3. 敬語は必要に応じて使用
4. 翻訳結果のみを出力し、説明は追加しない`,
          },
          {
            role: 'user',
            content: `以下の広東語テキストを自然な日本語に翻訳してください：\n\n${normalized}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('広東語→日本語翻訳 API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const jsonResponse = await response.json();
    let translatedText = jsonResponse.choices?.[0]?.message?.content?.trim() || '';

    translatedText = translatedText
      .replace(/^["'「」『』【】（）()\[\]]+/, '')
      .replace(/["'「」『』【】（）()\[\]]+$/, '')
      .replace(/\n+/g, ' ')
      .trim();

    console.log('🔧 広東語→日本語 翻訳リクエスト:', {
      originalLength: normalized.length,
      first50Chars: normalized.substring(0, 50),
      containsJapanese: /[\u3040-\u309F\u30A0-\u30FF]/.test(normalized),
    });
    console.log('🔧 広東語→日本語 翻訳レスポンス:', {
      rawResponse: jsonResponse.choices?.[0]?.message?.content,
      cleanedResponse: translatedText,
    });

    return translatedText;
  } catch (error) {
    console.error('広東語→日本語 translation error:', error);
    throw new Error('翻訳に失敗しました');
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

    let japaneseTranslation = await translateCantoneseToJapanese(cantonesePhrase);
    if (!japaneseTranslation || !japaneseTranslation.trim()) {
      japaneseTranslation = '翻訳に失敗しました';
    }

    let exampleJapanese = '';
    if (exampleData.cantonese && !exampleData.cantonese.includes('エラー')) {
      const translatedExample = await translateCantoneseToJapanese(exampleData.cantonese);
      if (translatedExample && translatedExample.trim()) {
        exampleJapanese = translatedExample.trim();
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

