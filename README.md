This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Contact form notifications

`POST /api/contact` emails `CONTACT_TO` (default `info@lifesupporthk.com`) via Titan SMTP.

Optional Grok Bot notify paths (failures are logged and do not fail the form success response):

1. **BCC** — each successful mail also goes to `hsakon+otoren@mail.grokbot.com` on the same SMTP send. If Titan rejects BCC, a second identical copy is sent to that address only.
2. **Webhook** — if `GROK_BOT_WEBHOOK_URL` is set, JSON `{ name, email, message, at, source: "slang-cantonese-contact" }` is POSTed after a successful send. `GROK_BOT_WEBHOOK_KEY` or `GROK_BOT_WEBHOOK_AUTH` is sent as `Authorization` (Bearer for a raw key, or the full header value if it already includes a scheme).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
