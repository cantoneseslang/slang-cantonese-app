/**
 * Google OAuth は埋め込み WebView / アプリ内ブラウザをブロックするため、
 * 事前に案内して標準ブラウザ利用へ誘導する。
 */
export function getInAppBrowserBlockMessage(userAgent: string): string | null {
  const ua = userAgent || '';

  // X（旧 Twitter）
  if (/Twitter/i.test(ua) || /XAndroid/i.test(ua) || /X iOS/i.test(ua)) {
    return 'XアプリのブラウザからはGoogleログインができません。右上の「…」メニューから「ブラウザで開く」を選び、SafariやChromeなどの標準ブラウザで開いてください。';
  }

  // LINE
  if (/\bLine\//i.test(ua) || /\bLINE\//i.test(ua) || /L\/LINE/i.test(ua)) {
    return 'LINEアプリ内のブラウザからはGoogleログインができません。右上のメニューから「ブラウザで開く」または「外部ブラウザで開く」を選び、SafariやChromeで開いてください。';
  }

  // Instagram
  if (/Instagram/i.test(ua)) {
    return 'Instagramアプリ内のブラウザからはGoogleログインができません。…メニューから「ブラウザで開く」でSafariやChromeをご利用ください。';
  }

  // Facebook / Messenger アプリ内ブラウザ
  if (/FBAN|FBAV|FB_IAB|FB4A|FBMD|FBIOS/i.test(ua)) {
    return 'Facebookアプリ内のブラウザからはGoogleログインができません。…メニューから「ブラウザで開く」でSafariやChromeをご利用ください。';
  }

  // WeChat
  if (/MicroMessenger/i.test(ua)) {
    return 'WeChat内蔵ブラウザからはGoogleログインができません。右上の「…」からシステムのブラウザで開いてください。';
  }

  // TikTok
  if (/BytedanceWebview|TikTok|musical_ly/i.test(ua)) {
    return 'TikTokアプリ内のブラウザからはGoogleログインができません。…から標準ブラウザで開いてください。';
  }

  // Snapchat / Pinterest / LinkedIn
  if (/Snapchat/i.test(ua)) {
    return 'SnapchatのブラウザからはGoogleログインができません。SafariやChromeで開き直してください。';
  }
  if (/Pinterest/i.test(ua)) {
    return 'Pinterestアプリ内のブラウザからはGoogleログインができません。標準ブラウザで開いてください。';
  }
  if (/LinkedInApp/i.test(ua)) {
    return 'LinkedInアプリ内のブラウザからはGoogleログインができません。標準ブラウザで開いてください。';
  }

  // Android 汎用 WebView（Chrome 本体とは別）
  if (/\bwv\b/i.test(ua) && /Android/i.test(ua)) {
    return 'このブラウザ（アプリ内表示）ではGoogleログインがブロックされることがあります。Safari・Chrome・Firefoxなどの標準ブラウザでURLを開き直してください。';
  }

  return null;
}
