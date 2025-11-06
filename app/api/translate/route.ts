import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API設定
const DEEPSEEK_API_KEY = 'sk-4762a303780f4233a5d1703c9b627a71';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// OPTIONSメソッドをサポート（CORS対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language } = body;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // 言語に応じて翻訳先を決定（デフォルトは広東語）
    const systemPrompt = language === 'mandarin' 
      ? "You are a professional Japanese-to-Mandarin Chinese translator. Translate Japanese text DIRECTLY to Mandarin Chinese (Simplified Chinese) in ONE STEP. NEVER use Cantonese or Traditional Chinese as an intermediate step."
      : "You are a professional translator. Translate the given Japanese text to Cantonese (traditional Chinese). Only provide the translation without any explanations or additional text. Use traditional Chinese characters. Be concise and fast.";
    
    // 北京語モードの場合、few-shot examplesを追加して直接翻訳を強制
    const messages = language === 'mandarin' 
      ? [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Translate: こんにちは"
          },
          {
            role: "assistant",
            content: "你好"
          },
          {
            role: "user",
            content: "Translate: ありがとうございます"
          },
          {
            role: "assistant",
            content: "谢谢"
          },
          {
            role: "user",
            content: `Translate: ${text}`
          }
        ]
      : [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Translate this Japanese text to Cantonese: ${text}`
          }
        ];
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 500,
        temperature: 0.0, // 温度を0に設定して最も確定的な翻訳を強制（中間ステップを完全に排除）
        top_p: 0.1, // top_pを低く設定して、より確定的な出力を促す
        stream: false // ストリーミング無効で高速化
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to translate', details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
    
    const jsonResponse = await response.json();
    let translated = jsonResponse.choices[0]?.message?.content?.trim() || '';
    
    // デバッグログ（北京語モードの場合）
    if (language === 'mandarin') {
      console.log('🔍 北京語翻訳API 生レスポンス:', translated.substring(0, 200));
    }
    
    // 北京語モードの場合、レスポンスをクリーンアップ
    if (language === 'mandarin') {
      // 改行で分割して、最初の有効な行を取得（説明文をスキップ）
      const lines = translated.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
      
      // 繁体字が含まれている行を検出して削除
      const simplifiedLines = lines.filter((line: string) => {
        // 繁体字のパターンをチェック（簡体字と繁体字の違いを検出）
        // 一般的な繁体字文字をチェック
        const hasTraditionalChars = /[繁體廣東語話]/g.test(line);
        if (hasTraditionalChars) {
          console.warn('⚠️ 繁体字が検出されました:', line);
          return false;
        }
        return true;
      });
      
      // 簡体字のみの行を取得
      if (simplifiedLines.length > 0) {
        translated = simplifiedLines[0]; // 最初の有効な行を使用
      }
      
      // 括弧で囲まれた説明文を削除
      translated = translated.replace(/^[（(].*?[）)]\s*/g, '');
      translated = translated.replace(/[（(].*?[）)]/g, '');
      
      // 引用符や角括弧を削除
      translated = translated.replace(/^["'「」『』\[\]\s]+|["'「」『』\[\]\s]+$/g, '');
      
      // 説明文のパターンを削除
      translated = translated.replace(/^(我將|我會|I will|I'll|I'm|翻訳|Translation|説明|説明文)/i, '');
      
      // 最終的なクリーンアップ
      translated = translated.trim();
      
      console.log('✅ 北京語翻訳API 最終結果:', translated.substring(0, 200));
    }
    
    return NextResponse.json({
      translated: translated
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error translating:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

