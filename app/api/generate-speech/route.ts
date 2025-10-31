import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, languageCode = 'yue-Hant-HK' } = body;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    // APIキーは環境変数から取得
    const apiKey = process.env.GOOGLE_TTS_API_KEY || 'AIzaSyBqgtrVVZ3LV3vMD-XHqe_HCHq3ojvDsfk';
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const payload = {
      input: { text: text },
      voice: { languageCode: languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseCode = response.status;
    
    if (responseCode !== 200) {
      const errorContent = await response.text();
      console.error('Google TTS API error:', errorContent);
      
      // 課金エラーの場合
      if (responseCode === 403 && errorContent.includes('billing')) {
        console.error('Billing not enabled');
        return NextResponse.json({ error: 'Billing not enabled' }, { status: 403 });
      }
      
      return NextResponse.json({ error: `API error: ${responseCode}` }, { status: responseCode });
    }

    const json = await response.json();
    if (!json.audioContent) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 500 });
    }
    
    // base64エンコードされた音声データをそのまま返す
    return NextResponse.json({
      audioContent: json.audioContent
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

