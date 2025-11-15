import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API設定
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const normalizeText = (text: string): string =>
  text
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .trim();

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
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured');
    }
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
    
    const normalizedText = normalizeText(text);

    // 言語に応じて翻訳先を決定（デフォルトは広東語）
    const messages =
      language === 'mandarin'
        ? [
            {
              role: 'system',
              content: `あなたはプロの翻訳者です。以下のルールに従って日本語を中国語（標準語・簡体字）に翻訳してください：
1. 意味を損なわず自然な口語表現にする
2. 不要な注釈や説明を追加しない
3. 訳文のみを簡潔に返す`,
            },
            {
              role: 'user',
              content: `以下の日本語テキストを自然な中国語（簡体字）に翻訳してください：\n\n${normalizedText}`,
            },
          ]
        : [
            {
              role: 'system',
              content: `あなたはプロの翻訳者です。以下のルールに従って日本語を広東語（繁体字）に翻訳してください：
1. 意味を損なわず自然な口語表現にする
2. 必要に応じて広東語特有の語彙を使用
3. 訳文のみを出力し、説明や注釈は追加しない`,
            },
            {
              role: 'user',
              content: `以下の日本語テキストを自然な広東語に翻訳してください：\n\n${normalizedText}`,
            },
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
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.8,
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

    translated = translated
      .replace(/^["'「」『』【】（）()\[\]]+/, '')
      .replace(/["'「」『』【】（）()\[\]]+$/, '')
      .replace(/\n+/g, ' ')
      .trim();

    console.log('🔧 translate API リクエスト:', {
      language,
      originalLength: normalizedText.length,
      first50Chars: normalizedText.substring(0, 50),
    });
    console.log('🔧 translate API レスポンス:', {
      rawResponse: jsonResponse.choices[0]?.message?.content,
      cleanedResponse: translated,
    });
    
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

