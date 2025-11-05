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
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: "スラング式カントン語音れん - 広東語万能辞書",
    description: "粤ピン/スラング式カタカナ/音声検索/日本語翻訳",
    type: "website",
    siteName: "スラング式カントン語音れん",
  },
  twitter: {
    card: 'summary_large_image',
    title: "スラング式カントン語音れん - 広東語万能辞書",
    description: "粤ピン/スラング式カタカナ/音声検索/日本語翻訳",
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
