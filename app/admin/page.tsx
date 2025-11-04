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
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics loading error:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Users loading error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        管理者画面
      </h1>

      {/* アナリティクスセクション */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ボタンアナリティクス
        </h2>
        <button
          onClick={loadAnalytics}
          disabled={loadingAnalytics}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingAnalytics ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            marginBottom: '1rem'
          }}
        >
          {loadingAnalytics ? '読み込み中...' : 'アナリティクスを読み込む'}
        </button>

        {analytics && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>総ボタン数:</strong> {analytics.totalButtons}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>カテゴリー別ボタン数:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {Object.entries(analytics.categoryButtons || {}).map(([category, count]: [string, any]) => (
                  <li key={category}>
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ユーザー管理
        </h2>
        <button
          onClick={loadUsers}
          disabled={loadingUsers}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingUsers ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            marginBottom: '1rem'
          }}
        >
          {loadingUsers ? '読み込み中...' : 'ユーザー一覧を読み込む'}
        </button>

        {users.length > 0 && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>総ユーザー数:</strong> {users.length}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>メールアドレス</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>会員種別</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {u.membership_type === 'free' ? 'ブロンズ' : 
                         u.membership_type === 'subscription' ? 'シルバー' : 
                         u.membership_type === 'lifetime' ? 'ゴールド' : '不明'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
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

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
}

