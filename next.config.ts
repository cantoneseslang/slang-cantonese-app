import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 中国からのアクセスを改善するための設定
  compress: true, // レスポンス圧縮を有効化
  poweredByHeader: false, // X-Powered-By ヘッダーを削除
  // 静的アセットの最適化
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
