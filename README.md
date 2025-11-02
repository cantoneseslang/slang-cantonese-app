This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ⚠️ 重要な初期設定チェック

**新しいプロジェクトで作業を始める前に、必ずSupabase設定を確認してください：**

```bash
npm run check-supabase
```

このコマンドは以下を自動チェックします：
- `.env.local` のプロジェクトID
- `~/.cursor/mcp.json` のMCP設定

**設定が一致しない場合：**
1. エラーメッセージに従ってMCP設定を更新
2. Cursorを再起動
3. 再度チェックコマンドを実行

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🔐 管理者ページ

管理者ページにアクセスするには、以下のURLにアクセスしてください：

```
http://localhost:3000/admin
```

**管理者権限:**
- Email: `bestinksalesman@gmail.com` が管理者として設定されています
- 他のユーザーを管理者にするには、Supabaseの`user_metadata`に`is_admin: true`を設定してください

**全ユーザー情報を取得するには:**
1. Supabaseダッシュボードにアクセス
2. Settings > API から「service_role」キーをコピー
3. `.env.local`に以下を追加：
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

**管理者ページの機能:**
- 会員情報一覧表示
- ユーザーネームの編集
- 会員種別の変更（ブロンズ/シルバー/ゴールド）
- 統計情報の表示

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
