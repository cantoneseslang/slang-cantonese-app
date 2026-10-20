import { NextRequest, NextResponse } from 'next/server';
import { forbidKantoGo } from '@/lib/asr-cantonese-fix';

// 通訳は Google と DeepSeek を同時に走らせ、先に返った方を使う
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

const normalizeText = (text: string): string =>
  forbidKantoGo(
    text
      .normalize('NFC')
      .replace(/\r\n/g, '\n')
      .trim()
  );

function cleanTranslatedText(text: string): string {
  return text
    .replace(/^["'「」『』【】（）()\[\]]+/, '')
    .replace(/["'「」『』【】（）()\[\]]+$/, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function googleLangPair(
  isYueToJa: boolean,
  isMandarin: boolean
): { source: string; target: string } {
  if (isYueToJa) return { source: 'yue', target: 'ja' };
  return { source: 'ja', target: isMandarin ? 'zh-CN' : 'yue' };
}

async function firstNonEmpty(
  labeled: Array<{ provider: string; task: Promise<string> }>
): Promise<{ translated: string; provider: string }> {
  return new Promise((resolve, reject) => {
    let pending = labeled.length;
    const errors: unknown[] = [];
    if (pending === 0) {
      reject(new Error('no translators'));
      return;
    }
    for (const item of labeled) {
      item.task
        .then((text) => {
          if (text) {
            resolve({ translated: text, provider: item.provider });
            return;
          }
          pending -= 1;
          if (pending === 0) reject(new Error('empty translation'));
        })
        .catch((err) => {
          errors.push(err);
          pending -= 1;
          if (pending === 0) reject(errors[0] ?? new Error('translate failed'));
        });
    }
  });
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
    const { text, language, direction } = body;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { 
        status: 400,
        headers: corsHeaders,
      });
    }
    
    const normalizedText = normalizeText(text);
    const isMandarin = language === 'mandarin';
    const isYueToJa = direction === 'yue-to-ja';
    const { source, target } = googleLangPair(isYueToJa, isMandarin);
    const labeled: Array<{ provider: string; task: Promise<string> }> = [];

    if (GOOGLE_API_KEY) {
      labeled.push({
        provider: 'google',
        task: translateWithGoogle(normalizedText, source, target),
      });
    }

    if (DEEPSEEK_API_KEY) {
      const messages = isYueToJa
        ? [
            {
              role: 'system',
              content: `あなたはプロの翻訳者です。以下のルールに従って広東語（口語）を日本語に翻訳してください：
1. 意味を損なわず自然な口語表現にする
2. 不要な注釈や説明を追加しない
3. 訳文のみを簡潔に返す`,
            },
            {
              role: 'user',
              content: `以下の広東語テキストを自然な日本語に翻訳してください：\n\n${normalizedText}`,
            },
          ]
        : isMandarin
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

      labeled.push({
        provider: 'deepseek',
        task: (async () => {
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
          return cleanTranslatedText(
            jsonResponse.choices?.[0]?.message?.content?.trim() || ''
          );
        })(),
      });
    }

    const { translated, provider } = await firstNonEmpty(labeled);

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
