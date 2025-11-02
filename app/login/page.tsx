'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const redirectPath = searchParams.get('redirect');
  const redirectMessage = searchParams.get('message');
  
  useEffect(() => {
    if (redirectMessage) {
      setMessage(redirectMessage);
    }
  }, [redirectMessage]);

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
        const data = await response.json();
        return data.email;
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
          setMessage('確認メールを送信しました。メールボックスを確認してください。');
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

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google認証でエラーが発生しました');
      setLoading(false);
    }
  };

  return (
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
                  fontSize: '1rem'
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
                  fontSize: '1rem'
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
                fontSize: '1rem'
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
                fontSize: '1rem'
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
      </div>
    </div>
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
