import { ImageResponse } from 'next/og';

export const alt = 'スラング式カントン語音れん - 広東語万能辞書';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // 画像のURLを構築（絶対URLが必要）
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://slang-cantonese-app.vercel.app';
  const imageUrl = `${baseUrl}/og-image.png`;

  console.log('🖼️ OG Image URL:', imageUrl);

  // 画像をfetchで読み込んでBase64エンコード
  let imageDataUrl: string | null = null;
  try {
    const response = await fetch(imageUrl, {
      cache: 'no-store' // キャッシュを無効化して最新の画像を取得
    });
    console.log('🖼️ Image fetch response:', response.status, response.ok);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('🖼️ Image size:', uint8Array.length, 'bytes');
      
      // Base64エンコード（エッジランタイム対応、チャンク処理）
      const chunkSize = 8192;
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      const base64 = btoa(binaryString);
      imageDataUrl = `data:image/png;base64,${base64}`;
      console.log('✅ Image Base64 encoded, length:', base64.length);
    } else {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Failed to load image:', error);
  }

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
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="カントン語音れん"
              width={400}
              height={470}
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}
            >
              🇭🇰
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

