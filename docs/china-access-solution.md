# 中国からのアクセス対策

Vercelは中国からアクセスできない場合があります。以下の対策を実装できます。

## 解決策1: Cloudflare経由のプロキシ（推奨）

### 手順

1. **カスタムドメインを取得**
   - 例: `slang-cantonese.com` など
   - Namecheap、GoDaddy、Cloudflare Registrar などで取得

2. **Cloudflareにドメインを追加**
   - https://dash.cloudflare.com/ にアクセス
   - 「Add Site」でドメインを追加
   - DNSレコードを自動設定

3. **Vercelでカスタムドメインを設定**
   - Vercelダッシュボード → プロジェクト → Settings → Domains
   - カスタムドメインを追加
   - DNSレコードをCloudflareに追加：
     ```
     Type: CNAME
     Name: @ (または www)
     Value: cname.vercel-dns.com
     Proxy status: Proxied (オレンジの雲アイコン)
     ```

4. **Cloudflareの設定**
   - SSL/TLS → Full (strict)
   - Speed → Auto Minify を有効化
   - Speed → Auto Minify を有効化

## 解決策2: 中国向けCDNの使用

### Alibaba Cloud CDN

1. Alibaba Cloudアカウントを作成
2. CDNサービスを有効化
3. Vercelをオリジンとして設定
4. 中国向けのエッジサーバーを利用

### Tencent Cloud CDN

1. Tencent Cloudアカウントを作成
2. CDNサービスを設定
3. オリジンをVercelに設定

## 解決策3: Next.js設定の最適化

`next.config.ts` に以下を追加：

```typescript
const nextConfig: NextConfig = {
  // 中国からのアクセスを改善する設定
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // 圧縮を有効化
  compress: true,
  // 静的アセットの最適化
  poweredByHeader: false,
};
```

## 解決策4: ミラーサーバーの設置

中国国内のサーバー（Alibaba Cloud ECS、Tencent Cloud CVMなど）にミラーを設置する方法もありますが、コストがかかります。

## 推奨順序

1. **まずは Cloudflare経由のプロキシ**（最も簡単で効果的）
2. それでも解決しない場合は中国向けCDNを検討
3. 最後の手段としてミラーサーバー

## 注意事項

- Cloudflare無料プランでもプロキシ機能は使用可能
- カスタムドメインの取得が必要
- SSL証明書はCloudflareが自動発行
- パフォーマンスは若干低下する可能性があるが、中国からのアクセスは改善される



