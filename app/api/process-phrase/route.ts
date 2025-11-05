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
            content: "You are a professional translator specializing in Japanese to Cantonese translation. Translate the given Japanese text into natural, conversational Cantonese (Traditional Chinese characters). Provide ONLY the Cantonese translation, nothing else. Do not add explanations, notes, or any other text. Just the translation."
          },
          {
            role: "user",
            content: `Please translate the following Japanese text to Cantonese. Provide only the Cantonese translation in Traditional Chinese characters:\n\n${japaneseText}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      })
    });
    
    const jsonResponse = await response.json();
    let translatedText = jsonResponse.choices[0].message.content.trim();
    
    // 不要な記号や引用符、説明文を削除
    translatedText = translatedText
      .replace(/^["'「」『』]|["'「」『』]$/g, '') // 引用符を削除
      .replace(/^(広東語|Cantonese|Translation|翻訳)[:：]\s*/i, '') // 説明文を削除
      .replace(/^.*?[:：]\s*/, '') // コロン以降の説明を削除
      .trim();
    
    // 翻訳結果が空または短すぎる場合はエラー
    if (!translatedText || translatedText.length < 3) {
      throw new Error('翻訳結果が空または不十分です');
    }
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

function isJapaneseText(text: string): boolean {
  // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
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
    
    // 不要な記号や引用符を削除
    fullExample = fullExample.replace(/^["'「」『』]|["'「」『』]$/g, '');
    
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
    
    if (isJapaneseText(phrase)) {
      try {
        cantonesePhrase = await translateJapaneseToCantonese(phrase);
        originalJapanese = phrase;
      } catch (error) {
        console.error('Translation failed:', error);
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
    
    return NextResponse.json({
      jyutping: jyutpingResult,
      katakana: katakanaResult,
      jyutpingMulti: jyutpingMultiArray.join("・"),
      katakanaMulti: katakanaMultiArray.join("・"),
      exampleCantonese: exampleData.cantonese,
      exampleJapanese: originalJapanese || exampleData.japanese,
      exampleFull: exampleData.full,
      originalText: originalJapanese || null,
      translatedText: originalJapanese ? cantonesePhrase : null
    });
  } catch (error) {
    console.error('Error processing phrase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

