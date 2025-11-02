# Vercel 中国アクセス対策 - 簡易ガイド

## 最も簡単な解決方法：Cloudflare経由のプロキシ

### 必要なもの
- カスタムドメイン（例: `slang-cantonese.com`）
- Cloudflareアカウント（無料プランでOK）

### セットアップ手順（5分で完了）

#### ステップ1: Cloudflareにドメインを追加

1. https://dash.cloudflare.com/ にログイン
2. 「Add Site」をクリック
3. ドメイン名を入力（例: `slang-cantonese.com`）
4. プラン選択（FreeプランでOK）
5. DNSレコードを確認（自動検出されます）

#### ステップ2: Vercelにカスタムドメインを追加

1. Vercelダッシュボード → プロジェクト選択
2. **Settings** → **Domains**
3. 「Add Domain」をクリック
4. ドメイン名を入力（例: `slang-cantonese.com` と `www.slang-cantonese.com`）
5. VercelがDNSレコードを表示

#### ステップ3: CloudflareでDNSレコードを設定

Cloudflareダッシュボード → DNS → Records で以下を追加：

```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy status: Proxied (オレンジの雲) ✅
TTL: Auto
```

```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: Proxied (オレンジの雲) ✅
TTL: Auto
```

**重要**: 「Proxied」（オレンジの雲アイコン）に設定することが必須です。これにより中国からもアクセス可能になります。

#### ステップ4: SSL/TLS設定

1. Cloudflareダッシュボード → SSL/TLS
2. **Overview** で「Full (strict)」を選択
3. 数分待つとSSL証明書が自動発行されます

#### ステップ5: 確認

1. 数分待つ（DNSの反映に時間がかかる場合があります）
2. `https://slang-cantonese.com` にアクセス
3. Vercelのサイトが表示されることを確認

## その他の最適化

### Cloudflareの設定

- **Speed** → Auto Minify を有効化
- **Caching** → Caching Level を Standard に設定
- **Network** → HTTP/3 (with QUIC) を有効化

### 注意事項

- カスタムドメインの取得が必要（年間約$10-15）
- DNS反映まで最大48時間かかる場合があります（通常は数分〜数時間）
- Cloudflare無料プランで十分動作します
- 中国からのアクセス速度が改善されます

