'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInAppBrowserBlockMessage } from '@/lib/in-app-browser';
import { parseResponseJson } from '@/lib/parse-response-json';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // アンケートフォームの状態
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyGender, setSurveyGender] = useState('');
  const [surveyResidence, setSurveyResidence] = useState('');
  const [surveyResidenceOther, setSurveyResidenceOther] = useState('');
  const [surveyCantoneseLevel, setSurveyCantoneseLevel] = useState('');
  const [signUpUserId, setSignUpUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const redirectPath = searchParams.get('redirect');
  const redirectMessage = searchParams.get('message');
  
  // 日本の都道府県リスト
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];
  
  useEffect(() => {
    if (redirectMessage) {
      setMessage(redirectMessage);
    }
  }, [redirectMessage]);

  // Google OAuth 完了後: アンケート未回答ならフォームを表示
  useEffect(() => {
    const surveyParam = searchParams.get('survey');
    if (surveyParam !== '1' && surveyParam !== 'true') return;

    let cancelled = false;
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (cancelled || !user) return;
      if (user.user_metadata?.survey_completed === true) return;
      setShowSurvey(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Force light color scheme for this page, even in dark mode browsers
  useEffect(() => {
    // Set color-scheme meta tag
    const meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'light';
    document.head.appendChild(meta);
    
    // Also set it on the html element as CSS property
    document.documentElement.style.colorScheme = 'light';
    
    // Force input styles directly via JavaScript (for Cursor browser and other strict browsers)
    const forceInputStyles = () => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], select, textarea');
      inputs.forEach((input: any) => {
        if (input && input.style) {
          // Use setProperty with important flag
          try {
            input.style.setProperty('background-color', '#ffffff', 'important');
            input.style.setProperty('color', '#111827', 'important');
            input.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
            input.style.setProperty('border-color', '#d1d5db', 'important');
          } catch (e) {
            // Fallback: direct assignment (may not override important styles but will set defaults)
            input.style.backgroundColor = '#ffffff';
            input.style.color = '#111827';
            (input.style as any).webkitTextFillColor = '#111827';
            input.style.borderColor = '#d1d5db';
          }
        }
      });
    };
    
    // Apply immediately
    forceInputStyles();
    
    // Also apply after a short delay to catch dynamically added inputs
    const timeoutId = setTimeout(forceInputStyles, 100);
    
    // Apply again after a longer delay to ensure styles are applied
    const timeoutId2 = setTimeout(forceInputStyles, 500);
    
    // Use MutationObserver to watch for any input changes
    const observer = new MutationObserver(() => {
      forceInputStyles();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Also periodically force styles (for stubborn browsers like Cursor)
    const intervalId = setInterval(forceInputStyles, 1000);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearInterval(intervalId);
      observer.disconnect();
      const existingMeta = document.querySelector('meta[name="color-scheme"]');
      if (existingMeta) {
        existingMeta.remove();
      }
      document.documentElement.style.colorScheme = '';
    };
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'パスワードは6文字以上必要です';
    }
    // 英文字（大文字・小文字）、数字、記号のうち、少なくとも2種類以上を含む
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    
    const typeCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (typeCount < 2) {
      return 'パスワードは英文字、数字、記号のうち少なくとも2種類以上を含む必要があります';
    }
    
    return null;
  };

  const findUserByUsername = async (username: string): Promise<string | null> => {
    try {
      // まずメタデータから検索を試みる（簡易版）
      // 実際の実装では、Supabaseのadmin APIまたはカスタムテーブルを使用
      const { data: { user } } = await supabase.auth.getUser();
      
      // クライアント側では直接検索できないため、APIルートを使用
      const response = await fetch('/api/find-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await parseResponseJson<{ email?: string }>(response);
        return data?.email ?? null;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setPasswordError(null);

    try {
      if (isSignUp) {
        // ユーザーネーム必須チェック
        if (!username.trim()) {
          setError('ユーザーネームを入力してください');
          setLoading(false);
          return;
        }

        // パスワードバリデーション
        const passwordValidation = validatePassword(password);
        if (passwordValidation) {
          setPasswordError(passwordValidation);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;

        // ユーザーネームテーブルに保存
        if (data.user) {
          try {
            await fetch('/api/save-username', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                username: username.trim(),
                email: email,
              }),
            });
          } catch (err) {
            console.error('Failed to save username:', err);
          }
          
          // アンケートフォームを表示
          setSignUpUserId(data.user.id);
          setShowSurvey(true);
          setMessage('');
        }
      } else {
        // ログイン時：ユーザーネームまたはメールアドレス
        let loginEmail = email.trim();
        
        // メールアドレス形式でない場合、ユーザーネームとして扱う
        if (!loginEmail.includes('@')) {
          const foundEmail = await findUserByUsername(loginEmail);
          if (!foundEmail) {
            setError('ユーザーネームまたはメールアドレスが見つかりません');
            setLoading(false);
            return;
          }
          loginEmail = foundEmail;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // リダイレクト先がある場合はそこに、なければホームに
          router.push(redirectPath || '/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let resetEmail = resetIdentifier.trim();
      
      // メールアドレス形式でない場合、ユーザーネームとして扱う
      if (!resetEmail.includes('@')) {
        const foundEmail = await findUserByUsername(resetEmail);
        if (!foundEmail) {
          setError('ユーザーネームまたはメールアドレスが見つかりません');
          setLoading(false);
          return;
        }
        resetEmail = foundEmail;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage('パスワード再設定用のメールを送信しました。メールボックスを確認してください。');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const inAppBlock = getInAppBrowserBlockMessage(userAgent);
    if (inAppBlock) {
      setError(inAppBlock);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?survey=true`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('disallowed_useragent')) {
        setError('このブラウザからはGoogleログインができません。標準ブラウザ（Safari、Chromeなど）で開いてください。');
      } else if (
        msg.includes('Unexpected end of JSON') ||
        msg.includes('Unexpected token')
      ) {
        setError(
          '通信に失敗しました。Wi-Fiを切り替えるか、Safari・Chromeなどの標準ブラウザでページを開き直して、再度お試しください。'
        );
      } else {
        setError(msg || 'Google認証でエラーが発生しました');
      }
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // バリデーション
    if (!surveyGender) {
      setError('性別を選択してください');
      setLoading(false);
      return;
    }
    if (!surveyResidence) {
      setError('居住地を選択してください');
      setLoading(false);
      return;
    }
    if (surveyResidence === '海外' && !surveyResidenceOther.trim()) {
      setError('居住地の詳細を入力してください');
      setLoading(false);
      return;
    }
    if (!surveyCantoneseLevel) {
      setError('広東語レベルを選択してください');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: surveyGender,
          residence: surveyResidence,
          residenceOther: surveyResidence === '海外' ? surveyResidenceOther : null,
          cantoneseLevel: surveyCantoneseLevel,
        }),
      });

      if (!response.ok) {
        const data = await parseResponseJson<{ error?: string }>(response);
        throw new Error(
          data?.error ?? `アンケートの保存に失敗しました（${response.status}）`
        );
      }

      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const oauthProvider = freshUser?.app_metadata?.provider;
      const confirmed = !!freshUser?.email_confirmed_at;

      setShowSurvey(false);
      setSurveyGender('');
      setSurveyResidence('');
      setSurveyResidenceOther('');
      setSurveyCantoneseLevel('');
      setSignUpUserId(null);

      if (oauthProvider === 'google' || confirmed) {
        setMessage('登録が完了しました。');
        router.push(redirectPath || '/');
        router.refresh();
      } else {
        setMessage('確認メールを送信しました。メールボックスを確認してください。');
      }
    } catch (err: any) {
      setError(err.message || 'アンケートの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Force light color scheme for this page */
        :root {
          color-scheme: light !important;
        }
        
        html {
          color-scheme: light !important;
        }
        
        /* Force white background and dark text for all inputs, even in dark mode */
        input[type="text"],
        input[type="email"],
        input[type="password"],
        select,
        input,
        textarea {
          background-color: #ffffff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          border-color: #d1d5db !important;
        }
        
        /* Override dark mode specifically - most aggressive */
        @media (prefers-color-scheme: dark) {
          :root {
            color-scheme: light !important;
          }
          
          html {
            color-scheme: light !important;
          }
          
          input[type="text"],
          input[type="email"],
          input[type="password"],
          select,
          input,
          textarea {
            background-color: #ffffff !important;
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
            border-color: #d1d5db !important;
          }
          
          input::placeholder {
            color: #9ca3af !important;
            opacity: 1 !important;
          }
        }
        
        /* Override autofill styles - more aggressive */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        input:-webkit-autofill::first-line {
          -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
          -webkit-text-fill-color: #111827 !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          caret-color: #111827 !important;
        }
        
        /* Override placeholder color - all variants */
        input::placeholder,
        input::-webkit-input-placeholder,
        input::-moz-placeholder,
        input:-ms-input-placeholder {
          color: #9ca3af !important;
          opacity: 1 !important;
        }
        
        /* Force select dropdown styling */
        select option {
          background-color: #ffffff !important;
          color: #111827 !important;
        }
        
        /* Override any form element styling */
        form input,
        form select,
        form textarea {
          background-color: #ffffff !important;
          color: #111827 !important;
        }
      `}} />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          歡迎光臨！ようこそ！
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#374151',
          marginBottom: '0.5rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          スラング先生広東語プラットフォームへ🇭🇰
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          お手数ですがご登録の上ご使用ください。
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#991b1b',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '4px',
            color: '#065f46',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}

        <div style={{
          padding: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '500' }}>
            ℹ️ Googleログインについて
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: '1.5' }}>
            Googleログイン時に「qdmvituurfevyibtzwsb.supabase.co」に移動と表示されますが、
            これは安全な認証プロセスの一部です。Supabase（認証サービス）を経由して
            安全にログイン処理を行います。心配ありません。
          </p>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: loading ? '#9ca3af' : '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.58 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Googleで{isSignUp ? '登録' : 'ログイン'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0'
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#e5e7eb'
          }}></div>
          <span style={{
            padding: '0 1rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>または</span>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#e5e7eb'
          }}></div>
        </div>

        {showResetPassword ? (
          <form onSubmit={handlePasswordReset} style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                ユーザーネームまたはメールアドレス
              </label>
              <input
                type="text"
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  color: '#111827'
                }}
                placeholder="ユーザーネームまたはメールアドレス"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#9ca3af' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {loading ? '送信中...' : 'パスワード再設定メールを送信'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(false);
                setError(null);
                setMessage(null);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ログインに戻る
            </button>
          </form>
        ) : (
          <>
        <form onSubmit={handleEmailAuth}>
          {isSignUp && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                ユーザーネーム
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isSignUp}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  color: '#111827'
                }}
                placeholder="ユーザーネーム"
              />
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              {isSignUp ? 'メールアドレス' : 'ユーザーネームまたはメールアドレス'}
            </label>
            <input
              type={isSignUp ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#111827'
              }}
              placeholder={isSignUp ? 'email@example.com' : 'ユーザーネームまたはメールアドレス'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isSignUp && e.target.value.length > 0) {
                  const validationError = validatePassword(e.target.value);
                  setPasswordError(validationError);
                } else {
                  setPasswordError(null);
                }
              }}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: passwordError ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#111827'
              }}
              placeholder={isSignUp ? '6文字以上（英文字・数字・記号の組み合わせ）' : 'パスワード'}
              minLength={6}
            />
            {passwordError && (
              <p style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {passwordError}
              </p>
            )}
            {isSignUp && !passwordError && password.length > 0 && (
              <p style={{
                fontSize: '0.75rem',
                color: '#10b981',
                marginTop: '0.25rem'
              }}>
                ✓ パスワードの形式は有効です
              </p>
            )}
            {isSignUp && password.length === 0 && (
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                6文字以上、英文字・数字・記号のうち少なくとも2種類以上を含む必要があります
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {loading ? '処理中...' : (isSignUp ? '新規登録' : 'ログイン')}
          </button>
        </form>

        {!isSignUp && (
          <button
            onClick={() => {
              setShowResetPassword(true);
              setError(null);
              setMessage(null);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginBottom: '1rem'
            }}
          >
            パスワードを忘れた場合
          </button>
        )}

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setShowResetPassword(false);
            setError(null);
            setMessage(null);
            setPasswordError(null);
            setUsername('');
            setEmail('');
            setPassword('');
            setResetIdentifier('');
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: 'none',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'すでにアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方は新規登録'}
        </button>
        </>
        )}

        {/* アンケートフォーム */}
        {showSurvey && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              簡易アンケート
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              サービス向上のため、簡単なアンケートにご協力ください
            </p>
            
            <form onSubmit={handleSurveySubmit}>
              {/* 性別 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  1. 性別 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['男性', '女性', '答えたくない'].map((option) => (
                    <label key={option} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={surveyGender === option}
                        onChange={(e) => setSurveyGender(e.target.value)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* 居住地 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  2. 居住地 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={surveyResidence}
                  onChange={(e) => {
                    setSurveyResidence(e.target.value);
                    if (e.target.value !== '海外') {
                      setSurveyResidenceOther('');
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                >
                  <option value="">選択してください</option>
                  <optgroup label="日本の都道府県">
                    {prefectures.map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </optgroup>
                  <option value="海外">海外</option>
                </select>
                
                {surveyResidence === '海外' && (
                  <input
                    type="text"
                    value={surveyResidenceOther}
                    onChange={(e) => setSurveyResidenceOther(e.target.value)}
                    placeholder="国名または地域名を入力してください"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: '#ffffff',
                      color: '#111827'
                    }}
                  />
                )}
              </div>

              {/* 広東語レベル */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  3. 広東語レベル <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { value: '初心者', label: '初心者（発音すら習ったことない）' },
                    { value: '中級者', label: '中級者（学校に行った、独学である程度勉強し、基本単語はわかる）' },
                    { value: '上級者', label: '上級者（香港のローカルの方と遜色なく会話が可能である）' }
                  ].map((option) => (
                    <label key={option.value} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      padding: '0.75rem',
                      backgroundColor: surveyCantoneseLevel === option.value ? '#eff6ff' : 'transparent',
                      border: surveyCantoneseLevel === option.value ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="cantoneseLevel"
                        value={option.value}
                        checked={surveyCantoneseLevel === option.value}
                        onChange={(e) => setSurveyCantoneseLevel(e.target.value)}
                        style={{ marginRight: '0.75rem', marginTop: '0.125rem' }}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '1rem'
                }}
              >
                {loading ? '送信中...' : '送信して登録を完了'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          読み込み中...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
