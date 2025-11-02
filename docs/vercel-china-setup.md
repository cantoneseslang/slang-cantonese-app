# Vercel 中国アクセス対策 - 簡易ガイド

## 最も簡単な解決方法：Cloudflare経由のプロキシ

### 必要なもの
- カスタムドメイン（例: `slang-cantonese.com`）
- Cloudflareアカウント（**完全無料**）

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

## 💰 無料で使える方法

### オプション1: Cloudflare（完全無料）

- ✅ Cloudflareプロキシ機能: **完全無料**
- ✅ SSL証明書: **無料自動発行**
- ❌ カスタムドメイン: 必要（年間約$10-15、約1,500-2,250円）

### オプション2: 無料ドメインサービス（信頼性は低め）

以下のサービスで無料ドメインを取得できますが、**信頼性とパフォーマンスに問題がある場合があります**：

1. **Freenom** (https://www.freenom.com/)
   - `.tk`, `.ml`, `.ga`, `.cf`, `.gq` ドメインが無料
   - ただし、一部のドメインは信頼性が低い可能性があります

2. **Dot TK** (http://www.dot.tk/)
   - `.tk` ドメインが無料

3. **GitHub Student Pack**
   - 学生向けの無料ドメインクレジットが含まれている場合があります

**推奨**: 本番環境では、低コストでも有料ドメイン（例: Namecheap $0.99/年）の使用を推奨します。

### オプション3: 無料ホスティングサービスの利用（Vercel以外）

中国からアクセス可能な無料ホスティングサービス：
- **Netlify** - Vercelと似た機能、無料プランあり
- **GitHub Pages** - 静的サイト向け、無料
- **Railway** - 無料プランあり
- **Render** - 無料プランあり

ただし、これらのサービスも中国からアクセスできない可能性があります。

### 最安オプション: 実用的な組み合わせ

1. **Namecheap 初年度無料キャンペーン**（よくある）
   - `.xyz` ドメインが初年度無料の場合があります
   - 2年目以降も年間約$1-2程度

2. **Cloudflare Registrar**（最も安い選択肢）
   - Cloudflareで直接ドメインを購入
   - ほぼ原価で販売（手数料なし）
   - 例: `.com` が年間約$8-10程度

### 注意事項

- DNS反映まで最大48時間かかる場合があります（通常は数分〜数時間）
- Cloudflare無料プランで十分動作します
- 中国からのアクセス速度が改善されます
- 無料ドメインはSEOや信頼性の面で不利な場合があります

