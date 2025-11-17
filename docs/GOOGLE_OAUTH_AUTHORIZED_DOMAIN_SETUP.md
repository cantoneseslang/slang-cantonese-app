# Google OAuth承認済みドメインの設定方法

## 問題
Google Cloud Consoleの「承認済みドメイン」設定で、以下の警告が表示されています：
- 「次のドメインが見つかりません: slang-cantonese-app.vercel.app」

## 解決方法

### ステップ1: 承認済みドメインに追加

1. **「+ ドメインの追加」ボタンをクリック**
   - 現在「google.com」が登録されていますが、アプリのドメインを追加する必要があります

2. **ドメインを追加**
   - 新しい入力フィールドが表示されるので、以下を入力：
     ```
     slang-cantonese-app.vercel.app
     ```
   - **重要**: `https://` や末尾の `/` は不要です。ドメイン名のみを入力してください

3. **保存**
   - 設定を保存します

### ステップ2: Google Search Consoleでドメインを確認（推奨）

警告メッセージには「Google Search Console にアクセスして、ドメインが承認済みであるかどうかを確認してください」とあります。

1. **Google Search Consoleにアクセス**
   - https://search.google.com/search-console
   - または、警告メッセージ内の「Google Search Console」リンクをクリック

2. **プロパティを追加**
   - 「プロパティを追加」をクリック
   - 「URLプレフィックス」を選択
   - `https://slang-cantonese-app.vercel.app` を入力
   - 「続行」をクリック

3. **所有権の確認**
   - HTMLファイルのアップロード、HTMLタグの追加、DNS設定、Google Analyticsなど、いずれかの方法で所有権を確認
   - Vercelを使用している場合、DNS設定またはHTMLタグの追加が簡単です

### ステップ3: 動作確認

1. **Google Cloud Consoleで確認**
   - 「承認済みドメイン」セクションで警告が消えているか確認
   - `slang-cantonese-app.vercel.app` が承認済みドメインとして表示されているか確認

2. **OAuth認証をテスト**
   - アプリのログインページで「Googleでログイン」を試す
   - 正常に動作するか確認

## 注意事項

### ドメイン名の入力形式
- ✅ 正しい: `slang-cantonese-app.vercel.app`
- ❌ 間違い: `https://slang-cantonese-app.vercel.app`（プロトコル不要）
- ❌ 間違い: `slang-cantonese-app.vercel.app/`（末尾のスラッシュ不要）

### 承認済みドメインの上限
- Google Cloud Consoleでは、承認済みドメインの数に上限があります
- 詳細は「詳細」リンクをクリックして確認してください

### Vercelのカスタムドメインを使用している場合
- 独自ドメイン（例: `yourdomain.com`）を使用している場合、そのドメインも追加する必要があります
- 例: `yourdomain.com`、`www.yourdomain.com`（必要に応じて）

## 参考リンク

- [Google Cloud Console - OAuth同意画面](https://console.cloud.google.com/apis/credentials/consent)
- [Google Search Console](https://search.google.com/search-console)
- [Vercel Domain Configuration](https://vercel.com/docs/concepts/projects/domains)

