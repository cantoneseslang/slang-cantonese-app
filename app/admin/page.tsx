'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // 管理者チェック（実際の実装では、Supabaseのadmin APIまたはカスタムテーブルを使用）
      // ここでは、特定のメールアドレスを管理者として扱う
      const adminEmails = ['bestinksalesman@gmail.com']; // 管理者メールアドレス
      if (!adminEmails.includes(currentUser.email || '')) {
        alert('管理者権限がありません');
        router.push('/');
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch('/api/admin/button-analytics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        console.error('API error:', data.error);
        alert(`エラー: ${data.error}`);
        setAnalytics(null);
      } else {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
      alert('アナリティクスの読み込みに失敗しました');
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        console.error('API error:', data.error);
        alert(`エラー: ${data.error}`);
        setUsers([]);
      } else {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Users loading error:', error);
      alert('ユーザー一覧の読み込みに失敗しました');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '1rem' : '2rem', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '1rem' : '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: isMobile ? '1.5rem' : '2rem', 
        fontWeight: 'bold', 
        marginBottom: isMobile ? '1rem' : '2rem' 
      }}>
        管理者画面
      </h1>

      {/* アナリティクスセクション */}
      <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        <h2 style={{ 
          fontSize: isMobile ? '1.125rem' : '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: isMobile ? '0.75rem' : '1rem' 
        }}>
          ボタンアナリティクス
        </h2>
        <button
          onClick={loadAnalytics}
          disabled={loadingAnalytics}
          style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingAnalytics ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            marginBottom: '1rem',
            fontSize: isMobile ? '0.875rem' : '1rem',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {loadingAnalytics ? '読み込み中...' : 'アナリティクスを読み込む'}
        </button>

        {analytics && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              marginBottom: '1rem',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              <strong>総ボタン数:</strong> {analytics.totalButtons}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>カテゴリー別ボタン数:</strong>
              <ul style={{ 
                marginTop: '0.5rem', 
                paddingLeft: isMobile ? '1rem' : '1.5rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                lineHeight: 1.6
              }}>
                {Object.entries(analytics.categoryButtons || {}).map(([category, count]: [string, any]) => (
                  <li key={category} style={{ marginBottom: '0.25rem' }}>
                    {category}: {count}個
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ユーザー管理セクション */}
      <div>
        <h2 style={{ 
          fontSize: isMobile ? '1.125rem' : '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: isMobile ? '0.75rem' : '1rem' 
        }}>
          ユーザー管理
        </h2>
        <button
          onClick={loadUsers}
          disabled={loadingUsers}
          style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingUsers ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            marginBottom: '1rem',
            fontSize: isMobile ? '0.875rem' : '1rem',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {loadingUsers ? '読み込み中...' : 'ユーザー一覧を読み込む'}
        </button>

        {users.length > 0 && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              marginBottom: '1rem',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              <strong>総ユーザー数:</strong> {users.length}
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: isMobile ? '600px' : 'auto',
                fontSize: isMobile ? '0.75rem' : '1rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ 
                      padding: isMobile ? '0.5rem' : '0.75rem', 
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>メールアドレス</th>
                    <th style={{ 
                      padding: isMobile ? '0.5rem' : '0.75rem', 
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>会員種別</th>
                    <th style={{ 
                      padding: isMobile ? '0.5rem' : '0.75rem', 
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ 
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        wordBreak: 'break-all'
                      }}>{u.email}</td>
                      <td style={{ 
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {u.membership_type === 'free' ? 'ブロンズ' : 
                         u.membership_type === 'subscription' ? 'シルバー' : 
                         u.membership_type === 'lifetime' ? 'ゴールド' : '不明'}
                      </td>
                      <td style={{ 
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('ja-JP') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: isMobile ? '1.5rem' : '2rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
}

