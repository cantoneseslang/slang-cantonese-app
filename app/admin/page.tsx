'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 管理者ページは認証が必要なため、動的ページとして扱う
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  email: string;
  username: string | null;
  membership_type: string | null;
  has_password: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ username: string; membership_type: string }>({ username: '', membership_type: 'free' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        // ログインページにリダイレクトし、管理者用であることを示す
        router.push('/login?redirect=/admin&message=管理者ページにアクセスするにはログインが必要です');
        return;
      }

      setUser(currentUser);
      
      // 管理者チェック（emailが特定のドメイン、またはuser_metadataにis_adminフラグがある場合）
      const adminEmails = ['bestinksalesman@gmail.com']; // 管理者のメールアドレスを設定
      const isUserAdmin = 
        adminEmails.includes(currentUser.email || '') ||
        currentUser.user_metadata?.is_admin === true;
      
      if (!isUserAdmin) {
        alert('このページにアクセスする権限がありません');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    } catch (error) {
      console.error('管理者チェックエラー:', error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error('ユーザー取得エラー:', data);
        // 詳細なエラー情報を表示
        const errorMsg = data.error || '不明なエラー';
        const details = data.details ? `\n詳細: ${data.details}` : '';
        const debug = data.debug ? `\nデバッグ情報: ${JSON.stringify(data.debug, null, 2)}` : '';
        alert(`❌ ユーザー情報の取得に失敗しました\n\n${errorMsg}${details}${debug}`);
      }
    } catch (error: any) {
      console.error('ユーザー取得エラー:', error);
      alert(`❌ ユーザー情報の取得に失敗しました\n\n${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username || '',
      membership_type: user.membership_type || 'free'
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', membership_type: 'free' });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          username: editForm.username.trim(),
          membership_type: editForm.membership_type
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('ユーザー情報を更新しました');
        setEditingUser(null);
        fetchUsers(); // 一覧を再取得
      } else {
        alert('更新に失敗しました: ' + data.error);
      }
    } catch (error: any) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const getMembershipLabel = (type: string | null) => {
    switch (type) {
      case 'free': return 'ブロンズ会員';
      case 'subscription': return 'シルバー会員';
      case 'lifetime': return 'ゴールド会員';
      default: return '未設定';
    }
  };

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.25rem'
      }}>
        認証中...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* ヘッダー - 完全に独立したデザイン */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 0.5rem 0',
                color: 'white'
              }}>
                🔐 管理者ダッシュボード
              </h1>
              <p style={{
                margin: 0,
                opacity: 0.9,
                fontSize: '0.875rem'
              }}>
                会員情報管理システム
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}>
                👤 {user?.email}
              </div>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  router.push('/login');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* 会員情報一覧 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0
            }}>
              会員情報一覧
            </h2>
            <button
              onClick={fetchUsers}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🔄 更新
            </button>
          </div>

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              読み込み中...
            </div>
          ) : users.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              ユーザーが見つかりませんでした
            </div>
          ) : (
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>ID</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>Email</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>ユーザーネーム</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>会員種別</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>パスワード</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>最終ログイン</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>登録日</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}>
                        {u.id.substring(0, 8)}...
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: '#1f2937'
                      }}>
                        {u.email}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        {editingUser === u.id ? (
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              width: '100%',
                              maxWidth: '200px',
                              fontSize: '0.875rem'
                            }}
                            placeholder="ユーザーネーム"
                          />
                        ) : (
                          <span style={{ color: u.username ? '#1f2937' : '#9ca3af' }}>
                            {u.username || '未設定'}
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        {editingUser === u.id ? (
                          <select
                            value={editForm.membership_type}
                            onChange={(e) => setEditForm({ ...editForm, membership_type: e.target.value })}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="free">ブロンズ会員</option>
                            <option value="subscription">シルバー会員</option>
                            <option value="lifetime">ゴールド会員</option>
                          </select>
                        ) : (
                          <span>{getMembershipLabel(u.membership_type)}</span>
                        )}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: u.has_password ? '#10b981' : '#ef4444'
                      }}>
                        {u.has_password ? '✅ 設定済み' : '❌ 未設定'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {u.last_sign_in_at 
                          ? new Date(u.last_sign_in_at).toLocaleString('ja-JP')
                          : '未ログイン'
                        }
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {new Date(u.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td style={{
                        padding: '0.75rem'
                      }}>
                        {editingUser === u.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleSaveEdit(u.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(u)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            編集
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            📊 統計情報
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                総ユーザー数
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {users.length}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                ブロンズ会員
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {users.filter(u => u.membership_type === 'free' || !u.membership_type).length}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                シルバー会員
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {users.filter(u => u.membership_type === 'subscription').length}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                ゴールド会員
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {users.filter(u => u.membership_type === 'lifetime').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

