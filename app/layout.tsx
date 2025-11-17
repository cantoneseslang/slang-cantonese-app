import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "スラング式カントン語音れん - 広東語万能辞書",
  description: "粤ピン/スラング式カタカナ/音声検索/日本語翻訳",
  icons: {
    icon: [
      { url: '/icon.png', sizes: '120x120', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '120x120', type: 'image/png' }
    ],
  },
  openGraph: {
    title: "スラング式カントン語音れん - 広東語万能辞書",
    description: "粤ピン/スラング式カタカナ/音声検索/日本語翻訳",
    type: "website",
    siteName: "スラング式カントン語音れん",
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "スラング式カントン語音れん - 広東語万能辞書",
    description: "粤ピン/スラング式カタカナ/音声検索/日本語翻訳",
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" style={{ colorScheme: 'light' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
