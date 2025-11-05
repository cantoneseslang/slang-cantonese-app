import { ImageResponse } from 'next/og';

export const alt = 'スラング式カントン語音れん - 広東語万能辞書';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          スラング式カントン語音れん
        </div>
        <div
          style={{
            fontSize: 36,
            marginBottom: 40,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          広東語万能辞書
        </div>
        <div
          style={{
            fontSize: 28,
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: 0.8,
          }}
        >
          <span>粤ピン</span>
          <span>•</span>
          <span>スラング式カタカナ</span>
          <span>•</span>
          <span>音声検索</span>
          <span>•</span>
          <span>日本語翻訳</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

