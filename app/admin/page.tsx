/**
 * ⚠️ 重要：このファイルは管理者ページの全機能を含みます
 * 
 * このファイルは意図しない変更を防ぐため保護されています。
 * マージや自動修正時には注意が必要です。
 * 
 * このファイルには以下の重要な機能が含まれています：
 * - ユーザー管理機能
 * - ボタン利用分析機能
 * - お気に入りデータ分析機能
 * - 管理者認証機能
 * 
 * 変更する場合は必ず以下を確認してください：
 * - 変更内容が正しいか
 * - 既存の機能が壊れていないか
 * - 過去のコミット履歴で意図しない変更が入っていないか
 * 
 * このファイルを簡易版に戻したり、主要機能を削除しないでください。
 */

'use client';

import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ComposedChart, Line, Bar, BarChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 管理者ページは認証が必要なため、動的ページとして扱う
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  email: string;
  username: string | null;
  membership_type: string | null;
  subscription_expires_at: string | null;
  has_password: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string | null;
  survey_gender: string | null;
  survey_residence: string | null;
  survey_residence_other: string | null;
  survey_cantonese_level: string | null;
  survey_completed: boolean;
}

type ButtonAnalyticsRow = {
  user_id: string;
  email: string;
  pressed: number;
  not_pressed: number;
  favorites_count: number;
  favorite_words: string[];
  bookmark_count: number;
  convert_cantonese_count: number;
  convert_japanese_count: number;
  convert_char_count: number;
  interpreter_cantonese_count: number;
  interpreter_mandarin_count: number;
  interpreter_total_count: number;
};

type ButtonSortKey = 'email' | 'pressed' | 'not_pressed' | 'favorites_count' | 'bookmark_count' | 'convert_cantonese_count' | 'convert_japanese_count' | 'convert_char_count' | 'interpreter_cantonese_count' | 'interpreter_mandarin_count' | 'interpreter_total_count' | 'favorite_words';

const defaultButtonSort: { key: ButtonSortKey | null; dir: 'desc' | 'asc' } = { key: 'pressed', dir: 'desc' };
const LIST_PAGE_SIZE = 30;

type MemberSortKey = 'id' | 'email' | 'username' | 'membership_type' | 'subscription_expires_at' | 'favorites' | 'has_password' | 'last_sign_in_at' | 'created_at' | 'survey_gender' | 'survey_residence' | 'survey_cantonese_level';
const defaultMemberSort: { key: MemberSortKey | null; dir: 'desc' | 'asc' } = { key: 'created_at', dir: 'desc' };
const memberDateKeys = new Set<MemberSortKey>(['subscription_expires_at', 'last_sign_in_at', 'created_at']);
const membershipRank: Record<string, number> = { lifetime: 3, subscription: 2, free: 1 };
const levelRank: Record<string, number> = { 上級者: 3, 中級者: 2, 初心者: 1 };
const monthColors = ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#64748b'];

function memberSortValue(row: User, key: MemberSortKey, favorites: Record<string, number>): string | number | null {
  switch (key) {
    case 'id': return row.id;
    case 'email': return row.email || '';
    case 'username': return row.username || '';
    case 'membership_type': return membershipRank[row.membership_type || 'free'] ?? 0;
    case 'subscription_expires_at': return row.subscription_expires_at ? new Date(row.subscription_expires_at).getTime() : null;
    case 'favorites': return favorites[row.id] ?? 0;
    case 'has_password': return row.has_password ? 1 : 0;
    case 'last_sign_in_at': return row.last_sign_in_at ? new Date(row.last_sign_in_at).getTime() : null;
    case 'created_at': return new Date(row.created_at).getTime();
    case 'survey_gender': return row.survey_gender || '';
    case 'survey_residence': return row.survey_residence === '海外' ? `海外 ${row.survey_residence_other || ''}` : (row.survey_residence || '');
    case 'survey_cantonese_level': return levelRank[row.survey_cantonese_level || ''] ?? 0;
  }
}

function compareAdminValues(left: string | number | null, right: string | number | null, dir: 'desc' | 'asc') {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  const factor = dir === 'desc' ? -1 : 1;
  if (typeof left === 'string' || typeof right === 'string') {
    return String(left).localeCompare(String(right), 'ja') * factor;
  }
  return (left - right) * factor;
}

function countNamed(users: User[], pick: (user: User) => string, order: Array<{ name: string; color: string }>) {
  const counts = new Map(order.map((item) => [item.name, 0]));
  for (const user of users) {
    const name = pick(user);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return order
    .map((item) => ({ ...item, value: counts.get(item.name) ?? 0 }))
    .filter((item) => item.value > 0);
}

function buttonSortValue(row: ButtonAnalyticsRow, key: ButtonSortKey): string | number {
  if (key === 'email') return row.email || '';
  if (key === 'favorite_words') return row.favorite_words?.length ?? 0;
  return row[key] || 0;
}

function SharePie({ title, data }: { title: string; data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ color: '#6b7280', padding: '2rem 0' }}>データがありません</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78} paddingAngle={2}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ExpandListButton({ shown, total, onExpand, onCollapse }: { shown: number; total: number; onExpand: () => void; onCollapse: () => void }) {
  if (total <= LIST_PAGE_SIZE) return null;
  const remaining = total - shown;
  return (
    <div style={{ marginTop: '0.75rem' }}>
      {remaining > 0 && (
        <button
          type="button"
          onClick={onExpand}
          style={{ padding: '0.45rem 0.9rem', backgroundColor: 'white', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          {`さらに${Math.min(LIST_PAGE_SIZE, remaining)}人表示（残り${remaining}人）`}
        </button>
      )}
      {shown > LIST_PAGE_SIZE && (
        <button
          type="button"
          onClick={onCollapse}
          style={{ marginLeft: remaining > 0 ? '0.5rem' : 0, padding: '0.45rem 0.9rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
        >
          30人に戻す
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});
  const [buttonAnalytics, setButtonAnalytics] = useState<ButtonAnalyticsRow[]>([]);
  const [buttonSort, setButtonSort] = useState(defaultButtonSort);
  const [buttonDaily, setButtonDaily] = useState<Array<{ day: string; count: number; cumulative: number }>>([]);
  const [topButtons, setTopButtons] = useState<Array<{ label: string; count: number }>>([]);
  const [topFavoriteWords, setTopFavoriteWords] = useState<Array<{ word: string; count: number }>>([]);
  const [buttonListLimit, setButtonListLimit] = useState(LIST_PAGE_SIZE);
  const [memberListLimit, setMemberListLimit] = useState(LIST_PAGE_SIZE);
  const [memberSort, setMemberSort] = useState(defaultMemberSort);
  const [buttonTotal, setButtonTotal] = useState<number>(0);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonError, setButtonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ username: string; membership_type: string }>({ username: '', membership_type: 'free' });
  const [analyticsData, setAnalyticsData] = useState<Array<{ month: string; registrations: number; revenueJPY: number; revenueHKD: number }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
      fetchFavoritesCount();
      fetchButtonAnalytics();
      fetchAnalytics();
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
      
      console.log('📊 APIレスポンス:', {
        success: data.success,
        usersCount: data.users?.length || 0,
        sampleUsers: data.users?.slice(0, 3),
        allUsers: data.users
      });
      
      if (data.success) {
        const fetchedUsers = data.users || [];
        
        // デバッグ: 会員種別の集計
        const lifetimeCount = fetchedUsers.filter((u: User) => u.membership_type === 'lifetime').length;
        const subscriptionCount = fetchedUsers.filter((u: User) => u.membership_type === 'subscription').length;
        const freeCount = fetchedUsers.filter((u: User) => u.membership_type === 'free' || !u.membership_type).length;
        
        console.log('📊 フロントエンドでの会員種別集計:', {
          lifetime: lifetimeCount,
          subscription: subscriptionCount,
          free: freeCount,
          total: fetchedUsers.length,
          lifetimeUsers: fetchedUsers.filter((u: User) => u.membership_type === 'lifetime').map((u: User) => ({
            id: u.id,
            email: u.email,
            membership_type: u.membership_type
          }))
        });
        
        setUsers(fetchedUsers);
      } else {
        console.error('ユーザー取得エラー:', data);
        // 詳細なエラー情報を表示
        const errorMsg = data.error || '不明なエラー';
        const details = data.details ? `\n詳細: ${data.details}` : '';
        alert(`❌ ユーザー情報の取得に失敗しました\n\n${errorMsg}${details}`);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('ユーザー取得エラー:', error);
      alert(`❌ ユーザー情報の取得に失敗しました\n\n${error.message || String(error)}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoritesCount = async () => {
    try {
      const res = await fetch('/api/admin/favorites');
      const data = await res.json();
      if (data.success) {
        const map: Record<string, number> = {};
        (data.favorites || []).forEach((u: any) => {
          map[u.user_id] = u.favorites_count || 0;
        });
        setFavoritesCountMap(map);
      }
    } catch (e) {
      console.error('お気に入り数取得エラー', e);
    }
  }

  const fetchButtonAnalytics = async () => {
    try {
      setButtonLoading(true);
      setButtonError(null);
      const res = await fetch('/api/admin/button-analytics');
      const data = await res.json();
      if (data.success) {
        setButtonTotal(data.total_buttons || 0);
        setButtonAnalytics(data.users || []);
        setButtonDaily(data.daily || []);
        setTopButtons(data.top_buttons || []);
        setTopFavoriteWords(data.top_favorite_words || []);
      } else {
        setButtonError(data.error || '集計に失敗しました');
      }
    } catch (e) {
      console.error('ボタン集計取得エラー', e);
      setButtonError('集計に失敗しました');
    } finally {
      setButtonLoading(false);
    }
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data || []);
      } else {
        console.error('分析データ取得エラー:', data);
      }
    } catch (error) {
      console.error('分析データ取得エラー:', error);
    } finally {
      setAnalyticsLoading(false);
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
        fetchFavoritesCount(); // お気に入り数も再取得
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

  const formatCompactDateTime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const cycleButtonSort = (key: ButtonSortKey) => {
    setButtonSort((current) => {
      if (current.key !== key) return { key, dir: 'desc' };
      if (current.dir === 'desc') return { key, dir: 'asc' };
      return { key: null, dir: 'desc' };
    });
  };

  const sortedButtonAnalytics = useMemo(() => {
    if (!buttonSort.key) return buttonAnalytics;
    const factor = buttonSort.dir === 'desc' ? -1 : 1;
    const key = buttonSort.key;
    return [...buttonAnalytics].sort((a, b) => {
      const left = buttonSortValue(a, key);
      const right = buttonSortValue(b, key);
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left).localeCompare(String(right), 'ja') * factor;
      }
      return (left - right) * factor;
    });
  }, [buttonAnalytics, buttonSort]);

  const cycleMemberSort = (key: MemberSortKey) => {
    setMemberSort((current) => {
      if (current.key !== key) return { key, dir: 'desc' };
      if (current.dir === 'desc') return { key, dir: 'asc' };
      return { key: null, dir: 'desc' };
    });
  };

  const sortedMembers = useMemo(() => {
    if (!memberSort.key) return users;
    const key = memberSort.key;
    return [...users].sort((a, b) => compareAdminValues(
      memberSortValue(a, key, favoritesCountMap),
      memberSortValue(b, key, favoritesCountMap),
      memberSort.dir
    ));
  }, [users, memberSort, favoritesCountMap]);

  const genderShares = useMemo(() => countNamed(users, (user) => user.survey_gender || '未回答', [
    { name: '男性', color: '#2563eb' },
    { name: '女性', color: '#ec4899' },
    { name: '答えたくない', color: '#a855f7' },
    { name: '未回答', color: '#d1d5db' },
  ]), [users]);

  const levelShares = useMemo(() => countNamed(users, (user) => user.survey_cantonese_level || '未回答', [
    { name: '初心者', color: '#22c55e' },
    { name: '中級者', color: '#2563eb' },
    { name: '上級者', color: '#a855f7' },
    { name: '未回答', color: '#d1d5db' },
  ]), [users]);

  const membershipShares = useMemo(() => countNamed(users, (user) => getMembershipLabel(user.membership_type), [
    { name: 'ブロンズ会員', color: '#b45309' },
    { name: 'シルバー会員', color: '#64748b' },
    { name: 'ゴールド会員', color: '#eab308' },
  ]), [users]);

  const registrationShares = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of users) {
      const date = new Date(user.created_at);
      const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      counts.set(month, (counts.get(month) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value], index) => ({ name, value, color: monthColors[index % monthColors.length] }));
  }, [users]);

  const memberTh: CSSProperties = {
    padding: '0.3rem 0.45rem',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: '#374151',
    whiteSpace: 'nowrap',
    writingMode: 'horizontal-tb',
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    lineHeight: 1.25,
  };

  const memberTd: CSSProperties = {
    padding: '0.22rem 0.45rem',
    fontSize: '0.8125rem',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    writingMode: 'horizontal-tb',
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    verticalAlign: 'middle',
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
        maxWidth: '100%',
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

        {/* 統計情報 */}
        <div style={{
          marginTop: '2rem',
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
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.75rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
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
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
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
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
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
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
                ゴールド会員
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {users.filter(u => u.membership_type === 'lifetime').length}
              </div>
            </div>
          </div>
        </div>

        {/* 月別会員登録数・売上分析 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            color: '#1f2937'
          }}>
            📈 月別会員登録数・売上分析
          </h3>
          {analyticsLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              読み込み中...
            </div>
          ) : analyticsData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              データがありません
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  yAxisId="left"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: '会員登録数（人）', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: '売上（円/HKD）', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === '売上 (JPY)') {
                      return [`¥${value.toLocaleString()}`, name];
                    }
                    if (name === '売上 (HKD)') {
                      return [`HK$${value.toLocaleString()}`, name];
                    }
                    return [`${value}人`, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="right"
                  dataKey="revenueJPY" 
                  fill="#8b5cf6" 
                  name="売上 (JPY)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="revenueHKD" 
                  fill="#10b981" 
                  name="売上 (HKD)"
                  radius={[8, 8, 0, 0]}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="会員登録数"
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem', color: '#1f2937' }}>
          利用の内訳
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <SharePie title="男女" data={genderShares} />
          <SharePie title="広東語レベル" data={levelShares} />
          <SharePie title="会員種別" data={membershipShares} />
          <SharePie title="登録月" data={registrationShares} />
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>ブロンズ / シルバー / ゴールド</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={membershipShares}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="人数">
                  {membershipShares.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginTop: '1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
            毎日のボタン回数と累計
          </div>
          {buttonDaily.length === 0 ? (
            <div style={{ color: '#6b7280', padding: '1.5rem 0' }}>{buttonLoading ? '読み込み中...' : 'データがありません'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={buttonDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" minTickGap={28} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="その日の回数" fill="#93c5fd" />
                <Line yAxisId="right" dataKey="cumulative" name="累計" stroke="#1d4ed8" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ marginTop: '1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
            押された回数が多いボタン
          </div>
          {topButtons.length === 0 ? (
            <div style={{ color: '#6b7280', padding: '1.5rem 0' }}>{buttonLoading ? '読み込み中...' : 'データがありません'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topButtons} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={88} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="回数" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ marginTop: '1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
            お気に入り単語ランキング
          </div>
          {topFavoriteWords.length === 0 ? (
            <div style={{ color: '#6b7280', padding: '1.5rem 0' }}>{buttonLoading ? '読み込み中...' : 'データがありません'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={560}>
              <BarChart data={[...topFavoriteWords].reverse()} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="word" width={220} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="登録数" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ボタン利用分析 */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: 0
          }}>
            🧮 ボタン利用分析
          </h3>
          <button
            onClick={fetchButtonAnalytics}
            disabled={buttonLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: buttonLoading ? '#93c5fd' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: buttonLoading ? 'wait' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            {buttonLoading ? '集計中...' : '集計更新'}
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.75rem' }}>
          総ボタン数: <span style={{ fontWeight: 700 }}>{buttonTotal}</span>
          {buttonError && (
            <span style={{ marginLeft: '0.75rem', color: '#ef4444' }}>{buttonError}</span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'auto',
            fontSize: '0.8125rem',
            lineHeight: 1.25
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {([
                  ['email', 'Email'],
                  ['pressed', '押した数'],
                  ['not_pressed', '未押数'],
                  ['favorites_count', 'お気に入り数'],
                  ['bookmark_count', 'ブックマーク'],
                  ['convert_cantonese_count', '🇭🇰→🇯🇵'],
                  ['convert_japanese_count', '🇯🇵→🇭🇰'],
                  ['convert_char_count', '翻訳文字数'],
                  ['interpreter_cantonese_count', '通訳（カントン語）'],
                  ['interpreter_mandarin_count', '通訳（中国語）'],
                  ['interpreter_total_count', '通訳（合計）'],
                  ['favorite_words', 'お気に入り単語'],
                ] as Array<[ButtonSortKey, string]>).map(([key, label]) => {
                  const active = buttonSort.key === key;
                  const mark = active ? (buttonSort.dir === 'desc' ? '多い' : '少ない') : '';
                  return (
                    <th key={key} style={memberTh}>
                      <button
                        type="button"
                        onClick={() => cycleButtonSort(key)}
                        title="押すたびに 多い → 少ない → リセット"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          font: 'inherit',
                          fontWeight: 600,
                          color: active ? '#1d4ed8' : '#374151',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}{mark ? ` ${mark}` : ''}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedButtonAnalytics.slice(0, buttonListLimit).map((row, idx) => (
                <tr key={row.user_id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.email}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.pressed}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.not_pressed}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.favorites_count || 0}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.bookmark_count || 0}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.convert_cantonese_count || 0}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{row.convert_japanese_count || 0}</td>
                  <td style={{ ...memberTd, color: '#1f2937' }}>{(row.convert_char_count || 0).toLocaleString()}</td>
                  <td style={{ ...memberTd, color: '#1f2937', fontWeight: row.interpreter_cantonese_count > 0 ? 600 : 400 }}>
                    {row.interpreter_cantonese_count || 0}
                  </td>
                  <td style={{ ...memberTd, color: '#1f2937', fontWeight: row.interpreter_mandarin_count > 0 ? 600 : 400 }}>
                    {row.interpreter_mandarin_count || 0}
                  </td>
                  <td style={{ ...memberTd, color: '#1f2937', fontWeight: row.interpreter_total_count > 0 ? 700 : 400 }}>
                    {row.interpreter_total_count || 0}
                  </td>
                  <td style={{ ...memberTd, color: '#1f2937', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.favorite_words?.join(', ') || ''}>
                    {row.favorite_words && row.favorite_words.length > 0 
                      ? row.favorite_words.join(', ') 
                      : 'なし'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ExpandListButton
            shown={Math.min(buttonListLimit, sortedButtonAnalytics.length)}
            total={sortedButtonAnalytics.length}
            onExpand={() => setButtonListLimit((current) => current + LIST_PAGE_SIZE)}
            onCollapse={() => setButtonListLimit(LIST_PAGE_SIZE)}
          />
        </div>
      </div>

        {/* 会員情報一覧 */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.6rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0
            }}>
              会員情報一覧
            </h2>
            <button
              onClick={() => { fetchUsers(); fetchFavoritesCount(); fetchButtonAnalytics(); fetchAnalytics(); }}
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
                width: 'max-content',
                minWidth: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'auto',
                fontSize: '0.8125rem',
                lineHeight: 1.25
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {([
                      ['id', 'ID'],
                      ['email', 'Email'],
                      ['username', 'ユーザーネーム'],
                      ['membership_type', '会員種別'],
                      ['subscription_expires_at', '有効期限'],
                      ['favorites', 'お気に入り数'],
                      ['has_password', 'パスワード'],
                      ['last_sign_in_at', '最終ログイン'],
                      ['created_at', '登録日'],
                      ['survey_gender', '性別'],
                      ['survey_residence', '居住地'],
                      ['survey_cantonese_level', '広東語レベル'],
                    ] as Array<[MemberSortKey, string]>).map(([key, label]) => {
                      const active = memberSort.key === key;
                      const mark = !active
                        ? ''
                        : memberDateKeys.has(key)
                          ? (memberSort.dir === 'desc' ? '新しい順' : '古い順')
                          : (memberSort.dir === 'desc' ? '多い' : '少ない');
                      return (
                        <th key={key} style={memberTh}>
                          <button
                            type="button"
                            onClick={() => cycleMemberSort(key)}
                            title="押すたびに 多い → 少ない → リセット"
                            style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', fontWeight: 600, color: active ? '#1d4ed8' : '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {label}{mark ? ` ${mark}` : ''}
                          </button>
                        </th>
                      );
                    })}
                    <th style={memberTh}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.slice(0, memberListLimit).map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <td style={{ ...memberTd, color: '#6b7280', fontFamily: 'monospace' }}>
                        {u.id.substring(0, 8)}...
                      </td>
                      <td style={{ ...memberTd, color: '#1f2937' }}>
                        {u.email}
                      </td>
                      <td style={memberTd}>
                        {editingUser === u.id ? (
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            style={{
                              padding: '0.15rem 0.35rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              width: '100%',
                              maxWidth: '200px',
                              fontSize: '0.8125rem'
                            }}
                            placeholder="ユーザーネーム"
                          />
                        ) : (
                          <span style={{ color: u.username ? '#1f2937' : '#9ca3af' }}>
                            {u.username || '未設定'}
                          </span>
                        )}
                      </td>
                      <td style={memberTd}>
                        {editingUser === u.id ? (
                          <select
                            value={editForm.membership_type}
                            onChange={(e) => setEditForm({ ...editForm, membership_type: e.target.value })}
                            style={{
                              padding: '0.15rem 0.35rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.8125rem'
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
                        ...memberTd,
                        color: u.subscription_expires_at ? 
                          (new Date(u.subscription_expires_at) < new Date() ? '#ef4444' : '#10b981') 
                          : '#6b7280'
                      }}>
                        {u.membership_type === 'subscription' && u.subscription_expires_at ? (
                          <>
                            {new Date(u.subscription_expires_at).toLocaleDateString('ja-JP')}
                            {new Date(u.subscription_expires_at) < new Date() && ' (期限切れ)'}
                          </>
                        ) : u.membership_type === 'lifetime' ? (
                          '無期限'
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={memberTd}>
                        {favoritesCountMap[u.id] ?? 0}
                      </td>
                      <td style={{
                        ...memberTd,
                        color: u.has_password ? '#10b981' : '#ef4444'
                      }}>
                        {u.has_password ? '設定済' : '未設定'}
                      </td>
                      <td style={{ ...memberTd, color: '#6b7280' }}>
                        {u.last_sign_in_at 
                          ? formatCompactDateTime(u.last_sign_in_at)
                          : '未ログイン'
                        }
                      </td>
                      <td style={{ ...memberTd, color: '#6b7280' }}>
                        {new Date(u.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td style={{
                        ...memberTd,
                        color: u.survey_gender ? '#1f2937' : '#9ca3af'
                      }}>
                        {u.survey_gender || '未回答'}
                      </td>
                      <td style={{
                        ...memberTd,
                        color: u.survey_residence ? '#1f2937' : '#9ca3af'
                      }}>
                        {u.survey_residence === '海外' 
                          ? `海外${u.survey_residence_other ? ` (${u.survey_residence_other})` : ''}`
                          : (u.survey_residence || '未回答')}
                      </td>
                      <td style={{
                        ...memberTd,
                        color: u.survey_cantonese_level ? '#1f2937' : '#9ca3af'
                      }}>
                        {u.survey_cantonese_level || '未回答'}
                      </td>
                      <td style={memberTd}>
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
              <ExpandListButton
                shown={Math.min(memberListLimit, sortedMembers.length)}
                total={sortedMembers.length}
                onExpand={() => setMemberListLimit((current) => current + LIST_PAGE_SIZE)}
                onCollapse={() => setMemberListLimit(LIST_PAGE_SIZE)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
