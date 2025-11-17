import { ImageResponse } from 'next/og';

export const alt = 'スラング式カントン語音れん - 広東語万能辞書';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // 画像のURLを取得（本番環境と開発環境の両方に対応）
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://slang-cantonese-app.vercel.app';
  const imageUrl = `${baseUrl}/og-image.png`;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        {/* 左側: テキストコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingRight: '40px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              marginBottom: 20,
            }}
          >
            スラング式カントン語音れん
          </div>
          <div
            style={{
              fontSize: 36,
              marginBottom: 40,
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

        {/* 右側: 写真 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '400px',
            height: '470px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <img
            src={imageUrl}
            alt="カントン語音れん"
            width={400}
            height={470}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

