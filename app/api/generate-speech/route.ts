import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY is not configured. Please set GOOGLE_API_KEY in environment variables.');
}

type VoiceConfig = {
  languageCode: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  name?: string;
};

const PREMIUM_VOICE_MAP: Record<string, VoiceConfig> = {
  'cantonese-female': {
    languageCode: 'yue-HK',
    name: 'yue-HK-Standard-A',
    ssmlGender: 'FEMALE',
  },
  'cantonese-male': {
    languageCode: 'yue-HK',
    name: 'yue-HK-Standard-B',
    ssmlGender: 'MALE',
  },
  'mandarin-female': {
    languageCode: 'cmn-CN',
    name: 'cmn-CN-Standard-A',
    ssmlGender: 'FEMALE',
  },
  'mandarin-male': {
    languageCode: 'cmn-CN',
    name: 'cmn-CN-Standard-D',
    ssmlGender: 'MALE',
  },
};

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, language, voiceKey } = body;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    const requestedLanguage: 'cantonese' | 'mandarin' | undefined =
      language === 'mandarin' ? 'mandarin' : language === 'cantonese' ? 'cantonese' : undefined;

    const defaultVoice: VoiceConfig =
      requestedLanguage === 'mandarin'
        ? { languageCode: 'zh-CN', ssmlGender: 'NEUTRAL' }
        : { languageCode: 'yue-Hant-HK', ssmlGender: 'NEUTRAL' };

    const selectedVoice =
      typeof voiceKey === 'string' && PREMIUM_VOICE_MAP[voiceKey]
        ? PREMIUM_VOICE_MAP[voiceKey]
        : undefined;

    const voiceParams: VoiceConfig = selectedVoice ?? defaultVoice;
    
    // 「一」の発音問題対策: 発話速度を遅くして頭切れを防ぐ
    let finalText = text;
    let useSSML = false;
    
    // 「一」で始まるテキストの場合、SSMLで発話速度を遅くして頭切れを防ぐ
    if (text === '一' || text.startsWith('一百') || text.startsWith('一千') || text.startsWith('一萬')) {
      // SSML形式で、発話速度を遅くして「一」を明瞭に発音
      // breakを使わず、rateとpitchのみで調整（プツッという音を防ぐ）
      finalText = `<speak><prosody rate="0.85" pitch="+0st">${text}</prosody></speak>`;
      useSSML = true;
      console.log('🔧 「一」対策: SSML形式（速度調整）を使用', { originalText: text, ssmlText: finalText });
    }
    
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
    const payload = {
      input: useSSML ? { ssml: finalText } : { text: finalText },
      voice: {
        languageCode: voiceParams.languageCode,
        ssmlGender: voiceParams.ssmlGender,
        ...(voiceParams.name ? { name: voiceParams.name } : {}),
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        // 音声の品質を上げる（頭切れ対策）
        sampleRateHertz: 24000
      }
    };

    console.log('🔊 音声生成API呼び出し開始:', {
      text: text.substring(0, 50),
      fullText: text,
      textLength: text.length,
      languageCode: voiceParams.languageCode,
      voice: voiceParams.name ?? 'default',
      ssmlGender: voiceParams.ssmlGender
    });

    // タイムアウト付きfetch（8秒でタイムアウト）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google TTS API error:', response.status, errorText);
        return NextResponse.json(
          { error: 'Failed to generate speech', details: errorText },
          { status: response.status }
        );
      }

      const json = await response.json();
      if (!json.audioContent) {
        console.error('❌ No audio content in response');
        return NextResponse.json(
          { error: 'No audio content in response' },
          { status: 500 }
        );
      }

      console.log('✅ 音声生成API成功:', { 
        audioContentLength: json.audioContent?.length || 0,
        requestedText: text,
        languageCode: voiceParams.languageCode
      });
      return NextResponse.json({
        audioContent: json.audioContent
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ 音声生成API: タイムアウトエラー');
        return NextResponse.json(
          { error: 'Request timeout', details: '音声生成がタイムアウトしました' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Error generating speech:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

