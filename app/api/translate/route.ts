import { NextRequest, NextResponse } from 'next/server';

// DeepSeek を優先。失敗時は Google Cloud Translation にフォールバック
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

const normalizeText = (text: string): string =>
  text
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .trim();

function cleanTranslatedText(text: string): string {
  return text
    .replace(/^["'「」『』【】（）()\[\]]+/, '')
    .replace(/["'「」『』【】（）()\[\]]+$/, '')
    .replace(/\n+/g, ' ')
    .trim();
}

async function translateWithGoogle(
  text: string,
  source: string,
  target: string
): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key is not configured');
  }

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Translate API error:', response.status, errorText);
    throw new Error(`Google Translate API error: ${response.status}`);
  }

  const jsonResponse = await response.json();
  return cleanTranslatedText(
    jsonResponse?.data?.translations?.[0]?.translatedText?.trim() || ''
  );
}

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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { text, language } = body;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { 
        status: 400,
        headers: corsHeaders,
      });
    }
    
    const normalizedText = normalizeText(text);
    const isMandarin = language === 'mandarin';
    let translated = '';
    let provider = '';

    if (DEEPSEEK_API_KEY) {
      try {
        const messages = isMandarin
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
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            max_tokens: 2000,
            temperature: 0.3,
            top_p: 0.8,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
        }

        const jsonResponse = await response.json();
        translated = cleanTranslatedText(
          jsonResponse.choices?.[0]?.message?.content?.trim() || ''
        );
        if (translated) {
          provider = 'deepseek';
        }
      } catch (error) {
        console.warn('DeepSeek翻訳失敗。Google翻訳へフォールバック:', error);
      }
    }

    if (!translated) {
      const target = isMandarin ? 'zh-CN' : 'yue';
      translated = await translateWithGoogle(normalizedText, 'ja', target);
      provider = 'google';
    }

    if (!translated) {
      return NextResponse.json(
        { error: 'Failed to translate' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('🔧 translate API:', {
      language,
      provider,
      originalLength: normalizedText.length,
      first50Chars: normalizedText.substring(0, 50),
      cleanedResponse: translated.substring(0, 50),
    });
    
    return NextResponse.json({
      translated,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error translating:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
