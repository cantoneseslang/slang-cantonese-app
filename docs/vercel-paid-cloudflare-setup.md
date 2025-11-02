# Vercel有料プラン + Cloudflare 中国アクセス対策

## ✅ 最も簡単な解決方法

**Vercel有料プランを継続使用し、Cloudflare経由でアクセス可能にする**

- Vercel: **変更不要**（現在の有料プランを継続）
- Cloudflare: **完全無料**（プロキシ機能無料）
- 追加コスト: カスタムドメインのみ（既にあれば追加コストなし）

## 手順

### ステップ1: カスタムドメインの確認

既にVercelでカスタムドメインを使用している場合：
- そのドメインをそのまま使用可能
- 追加で購入する必要はありません

カスタムドメインがない場合：
- Cloudflare Registrarで最安価格（年間約$1-5）で購入可能

### ステップ2: Cloudflareにドメインを追加

1. https://dash.cloudflare.com/ にアクセス（アカウント作成は無料）
2. 「Add Site」をクリック
3. 使用するドメイン名を入力
4. プラン選択: **Freeプラン**（完全無料でOK）
5. DNSレコードを確認

### ステップ3: CloudflareでDNSレコードを設定

**重要**: VercelのDNS設定ではなく、Cloudflareで設定します。

Cloudflareダッシュボード → DNS → Records で以下を追加：

```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy status: Proxied (オレンジの雲アイコン) ✅
TTL: Auto
```

```
Type: CNAME  
Name: www
Target: cname.vercel-dns.com
Proxy status: Proxied (オレンジの雲アイコン) ✅
TTL: Auto
```

**⚠️ 重要**: 「Proxied」（オレンジの雲アイコン）を有効にしてください。これで中国からもアクセス可能になります。

### ステップ4: Vercelでカスタムドメインを設定（まだの場合）

既にカスタムドメインを設定している場合はスキップしてください。

1. Vercelダッシュボード → プロジェクト → Settings → Domains
2. カスタムドメインを追加
3. VercelがDNSレコードを表示（これは参考情報）

### ステップ5: SSL/TLS設定

1. Cloudflareダッシュボード → SSL/TLS
2. **Overview** で「Full (strict)」を選択
3. 数分待つとSSL証明書が自動発行されます

### ステップ6: 確認

1. 数分〜数時間待つ（DNS反映のため）
2. カスタムドメインでアクセスして動作確認
3. 中国からもアクセス可能になります

## コスト

- **Vercel**: 現在の有料プランを継続（追加コストなし）
- **Cloudflare**: 完全無料
- **カスタムドメイン**: 既にあれば追加コストなし、なければ年間約$1-5

## メリット

- ✅ Vercelの設定変更不要
- ✅ コード変更不要
- ✅ Cloudflare無料プランで十分
- ✅ 中国からのアクセス速度も改善
- ✅ DDoS保護も追加で無料

## 注意事項

- DNS反映まで最大48時間かかる場合があります（通常は数分〜数時間）
- Cloudflare経由になるため、レスポンス時間が若干増える可能性がありますが、中国からのアクセスは確実に改善されます

