import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// CSVデータとJSONデータを事前に読み込む
const jyutpingDataPath = path.join(process.cwd(), 'public/google_drive_data.csv');
const katakanaDataPath = path.join(process.cwd(), 'public/katakana_conversion_data.csv');

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phrase } = body;
    
    if (!phrase) {
      return NextResponse.json({ error: 'Phrase is required' }, { status: 400 });
    }
    
    const results = findAllJyutpingsAndKatakanaForPhrase(phrase);
    
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
    
    return NextResponse.json({
      jyutping: jyutpingResult,
      katakana: katakanaResult,
      jyutpingMulti: jyutpingMultiArray.join("・"),
      katakanaMulti: katakanaMultiArray.join("・")
    });
  } catch (error) {
    console.error('Error processing phrase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

