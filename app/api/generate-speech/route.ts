import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBqgtrVVZ3LV3vMD-XHqe_HCHq3ojvDsfk';

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
    
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
    const payload = {
      input: { text: text },
      voice: {
        languageCode: voiceParams.languageCode,
        ssmlGender: voiceParams.ssmlGender,
        ...(voiceParams.name ? { name: voiceParams.name } : {}),
      },
      audioConfig: { audioEncoding: 'MP3' }
    };

    console.log('🔊 音声生成API呼び出し開始:', { text: text.substring(0, 50), languageCode });

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

      console.log('✅ 音声生成API成功:', { audioContentLength: json.audioContent?.length || 0 });
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

