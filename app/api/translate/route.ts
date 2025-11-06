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
    const { text } = body;
    
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
            content: "You are a professional translator. Translate the given Japanese text to Cantonese (traditional Chinese). Only provide the translation without any explanations or additional text. Use traditional Chinese characters. Be concise and fast."
          },
          {
            role: "user",
            content: `Translate this Japanese text to Cantonese: ${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
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
    const translated = jsonResponse.choices[0]?.message?.content?.trim() || '';
    
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

